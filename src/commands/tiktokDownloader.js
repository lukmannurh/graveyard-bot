import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pkg from "whatsapp-web.js";
const { MessageMedia } = pkg;
import logger from "../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = "https://api.ryzendesu.vip/api/downloader/ttdl";
const API_KEY = "YOUR_API_KEY_HERE"; // Ganti dengan API key Anda jika diperlukan

async function downloadTikTokVideo(message, args) {
  if (args.length === 0) {
    await message.reply(
      "Silakan masukkan URL video TikTok setelah perintah .tt"
    );
    return;
  }

  const url = args[0];
  logger.info(`Attempting to download TikTok video: ${url}`);

  try {
    const response = await axios.get(API_URL, {
      params: { url, apikey: API_KEY },
    });
    logger.debug(`API Response: ${JSON.stringify(response.data)}`);

    if (response.data && response.data.data && response.data.data.play) {
      const videoUrl = response.data.data.play;
      logger.info(`Video URL obtained: ${videoUrl}`);

      const tempFilePath = path.join(
        __dirname,
        "../../temp",
        `tiktok_${Date.now()}.mp4`
      );
      const writer = fs.createWriteStream(tempFilePath);

      const videoResponse = await axios({
        method: "get",
        url: videoUrl,
        responseType: "stream",
      });

      videoResponse.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      logger.info(`Video downloaded to: ${tempFilePath}`);

      const media = MessageMedia.fromFilePath(tempFilePath);
      await message.reply(media, null, {
        caption: "Video TikTok yang diminta",
      });

      fs.unlinkSync(tempFilePath);

      logger.info(`TikTok video downloaded and sent successfully: ${url}`);
    } else {
      logger.warn(
        `Invalid API response structure: ${JSON.stringify(response.data)}`
      );
      await message.reply(
        "Maaf, tidak dapat mengunduh video TikTok. Pastikan URL valid."
      );
    }
  } catch (error) {
    logger.error(`Error downloading TikTok video: ${error.message}`);
    if (error.response) {
      logger.error(
        `API Error Response: ${JSON.stringify(error.response.data)}`
      );
    }
    await message.reply(
      "Terjadi kesalahan saat mengunduh video TikTok. Silakan coba lagi nanti."
    );
  }
}

export default downloadTikTokVideo;
