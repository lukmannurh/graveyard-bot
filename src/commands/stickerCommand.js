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
    const tempDir = path.join(__dirname, "../../temp");
    await fs.mkdir(tempDir, { recursive: true });

    if (media.mimetype.startsWith("image/")) {
      await processImage(media, message, tempDir);
    } else if (media.mimetype.startsWith("video/")) {
      await processVideo(media, message, tempDir);
    } else {
      await message.reply(
        "File yang dikirim bukan gambar atau video. Silakan kirim gambar atau video untuk diubah menjadi stiker."
      );
    }
  } catch (error) {
    logger.error("Error in stickerCommand:", error);
    await message.reply(
      "Terjadi kesalahan saat membuat stiker. Silakan coba lagi nanti."
    );
  }
}

async function processImage(media, message, tempDir) {
  // ... (kode processImage tetap sama)
}

async function processVideo(media, message, tempDir) {
  const videoPath = path.join(tempDir, `video_${Date.now()}.mp4`);
  await fs.writeFile(videoPath, Buffer.from(media.data, "base64"));

  const outputPath = path.join(tempDir, `sticker_${Date.now()}.webp`);

  try {
    await new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .setStartTime(0)
        .setDuration(10) // Limit to 10 seconds
        .addOutputOptions([
          "-vcodec",
          "libwebp",
          "-vf",
          "scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=white@0.0,split[a][b];[a]palettegen=reserve_transparent=on:transparency_color=ffffff[p];[b][p]paletteuse",
          "-loop",
          "0",
          "-preset",
          "default",
          "-an",
          "-vsync",
          "0",
        ])
        .toFormat("webp")
        .on("end", () => resolve())
        .on("error", (err) => reject(err))
        .save(outputPath);
    });

    const stickerBuffer = await fs.readFile(outputPath);
    const stickerMedia = new MessageMedia(
      "image/webp",
      stickerBuffer.toString("base64")
    );
    await message.reply(stickerMedia, undefined, { sendMediaAsSticker: true });

    logger.info("Video sticker sent successfully");
  } catch (error) {
    logger.error("Error processing video:", error);
    await message.reply(
      "Terjadi kesalahan saat memproses video. Silakan coba lagi nanti."
    );
  } finally {
    await fs.unlink(videoPath).catch(() => {});
    await fs.unlink(outputPath).catch(() => {});
  }
}

export default stickerCommand;
