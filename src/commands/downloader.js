import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from "whatsapp-web.js";
const { MessageMedia } = pkg;
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE_URL = 'https://api.ryzendesu.vip/api/downloader';

async function downloadMedia(url, type) {
  try {
    const response = await axios.get(`${API_BASE_URL}/${type}`, { params: { url } });
    logger.debug(`API Response: ${JSON.stringify(response.data)}`);

    if (response.data && response.data.data && response.data.data.url) {
      const mediaUrl = response.data.data.url;
      const mediaResponse = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(mediaResponse.data, 'binary');
      
      const tempFilePath = path.join(__dirname, '../../temp', `${type}_${Date.now()}.${type === 'ytmp3' ? 'mp3' : 'mp4'}`);
      fs.writeFileSync(tempFilePath, buffer);

      const fileSize = fs.statSync(tempFilePath).size;
      const isDocument = fileSize > 12 * 1024 * 1024; // Check if file is larger than 12MB

      const media = MessageMedia.fromFilePath(tempFilePath);
      
      fs.unlinkSync(tempFilePath);

      return { media, isDocument };
    } else {
      throw new Error('Invalid API response structure');
    }
  } catch (error) {
    logger.error(`Error downloading media: ${error.message}`);
    throw error;
  }
}

async function handleDownload(message, args, type) {
  if (args.length === 0) {
    await message.reply(`Please provide a ${type} URL after the command.`);
    return;
  }

  const url = args[0];
  logger.info(`Attempting to download ${type}: ${url}`);

  try {
    const { media, isDocument } = await downloadMedia(url, type);
    await message.reply(media, null, { sendMediaAsDocument: isDocument });
    logger.info(`${type} downloaded and sent successfully: ${url}`);
  } catch (error) {
    logger.error(`Error in ${type} command:`, error);
    await message.reply(`An error occurred while downloading the ${type}. Please try again later.`);
  }
}

export const ytdl = async (message, args) => handleDownload(message, args, 'ytdl');
export const ytmp4 = async (message, args) => handleDownload(message, args, 'ytmp4');
export const ytmp3 = async (message, args) => handleDownload(message, args, 'ytmp3');
export const spotify = async (message, args) => handleDownload(message, args, 'spotify');
export const fbdl = async (message, args) => handleDownload(message, args, 'fbdl');
export const igdl = async (message, args) => handleDownload(message, args, 'igdl');