import sharp from "sharp";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import pkg from "whatsapp-web.js";
const { MessageMedia } = pkg;
import logger from "../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

async function stickerCommand(message) {
  try {
    if (!message.hasMedia) {
      await message.reply(
        "Silakan kirim gambar atau video dengan caption .s untuk mengubahnya menjadi stiker."
      );
      return;
    }

    const media = await message.downloadMedia();
    if (!media) {
      await message.reply("Gagal mengunduh media. Silakan coba lagi.");
      return;
    }

    logger.info(`Processing media of type: ${media.mimetype}`);

    const tempDir = path.join(__dirname, "../../temp");
    await fs.mkdir(tempDir, { recursive: true });

    if (media.mimetype.startsWith("image/") && media.mimetype !== "image/gif") {
      await processImage(media, message, tempDir);
    } else {
      await processAnimatedMedia(media, message, tempDir);
    }
  } catch (error) {
    logger.error("Error in stickerCommand:", error);
    await message.reply(
      "Terjadi kesalahan saat membuat stiker. Silakan coba lagi nanti."
    );
  }
}

async function processImage(media, message, tempDir) {
  try {
    const imageBuffer = Buffer.from(media.data, "base64");
    const stickerBuffer = await sharp(imageBuffer)
      .resize(512, 512, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .webp()
      .toBuffer();

    const stickerMedia = new MessageMedia(
      "image/webp",
      stickerBuffer.toString("base64")
    );
    await message.reply(stickerMedia, null, { sendMediaAsSticker: true });

    logger.info("Image sticker sent successfully");
  } catch (error) {
    logger.error("Error processing image:", error);
    await message.reply(
      "Terjadi kesalahan saat memproses gambar. Silakan coba lagi nanti."
    );
  }
}

async function processAnimatedMedia(media, message, tempDir) {
  const inputPath = path.join(
    tempDir,
    `input_${Date.now()}.${media.mimetype.split("/")[1]}`
  );
  const outputPath = path.join(tempDir, `sticker_${Date.now()}.webp`);

  try {
    await fs.writeFile(inputPath, Buffer.from(media.data, "base64"));
    logger.info(`Input file saved: ${inputPath}`);

    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .inputOptions(["-t", "5"])
        .outputOptions([
          "-vcodec",
          "libwebp",
          "-vf",
          "scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=white@0.0",
          "-loop",
          "0",
          "-preset",
          "default",
          "-an",
          "-vsync",
          "0",
          "-ss",
          "00:00:00",
        ])
        .toFormat("webp")
        .on("start", (commandLine) => {
          logger.info("FFmpeg process started:", commandLine);
        })
        .on("progress", (progress) => {
          logger.info(`Processing: ${progress.percent}% done`);
        })
        .on("stderr", (stderrLine) => {
          logger.debug("FFmpeg stderr:", stderrLine);
        })
        .on("error", (err, stdout, stderr) => {
          logger.error("FFmpeg error:", err);
          logger.error("FFmpeg stdout:", stdout);
          logger.error("FFmpeg stderr:", stderr);
          reject(err);
        })
        .on("end", () => {
          logger.info("FFmpeg process completed");
          resolve();
        })
        .save(outputPath);
    });

    const stickerBuffer = await fs.readFile(outputPath);
    const stickerMedia = new MessageMedia(
      "image/webp",
      stickerBuffer.toString("base64")
    );

    await message.reply(stickerMedia, null, { sendMediaAsSticker: true });

    logger.info("Animated sticker sent successfully");
  } catch (error) {
    logger.error("Error processing animated media:", error);
    await message.reply(
      "Terjadi kesalahan saat memproses media. Silakan coba lagi nanti."
    );
  } finally {
    await fs
      .unlink(inputPath)
      .catch((e) => logger.error("Error deleting input file:", e));
    await fs
      .unlink(outputPath)
      .catch((e) => logger.error("Error deleting output file:", e));
  }
}

export default stickerCommand;
