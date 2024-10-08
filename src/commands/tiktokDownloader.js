// src/commands/tiktokDownloader.js
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'whatsapp-web.js';
const { MessageMedia } = pkg;
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = 'https://api.ryzendesu.vip/api/downloader/ttdl';

async function downloadTikTokVideo(message, args) {
  if (args.length === 0) {
    await message.reply('Silakan masukkan URL video TikTok setelah perintah .tt');
    return;
  }

  const url = args[0];
  
  try {
    const response = await axios.get(API_URL, { params: { url } });
    
    if (response.data && response.data.result && response.data.result.video) {
      const videoUrl = response.data.result.video;
      
      // Download video ke penyimpanan sementara
      const tempFilePath = path.join(__dirname, '../../temp', `tiktok_${Date.now()}.mp4`);
      const writer = fs.createWriteStream(tempFilePath);
      
      const videoResponse = await axios({
        method: 'get',
        url: videoUrl,
        responseType: 'stream'
      });

      videoResponse.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      // Kirim video sebagai balasan
      const media = MessageMedia.fromFilePath(tempFilePath);
      await message.reply(media, null, { caption: 'Video TikTok yang diminta' });

      // Hapus file sementara
      fs.unlinkSync(tempFilePath);
      
      logger.info(`TikTok video downloaded and sent successfully: ${url}`);
    } else {
      await message.reply('Maaf, tidak dapat mengunduh video TikTok. Pastikan URL valid.');
      logger.warn(`Failed to download TikTok video: ${url}`);
    }
  } catch (error) {
    await message.reply('Terjadi kesalahan saat mengunduh video TikTok. Silakan coba lagi nanti.');
    logger.error(`Error downloading TikTok video: ${error.message}`);
  }
}

export default downloadTikTokVideo;