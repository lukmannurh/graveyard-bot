import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from "whatsapp-web.js";
const { MessageMedia } = pkg;
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE_URL = 'https://api.ryzendesu.vip/api/downloader';
const MAX_MEDIA_SIZE = 12 * 1024 * 1024; // 12MB

async function downloadMedia(url, type) {
  try {
    const response = await axios.get(`${API_BASE_URL}/${type}`, { params: { url } });
    logger.debug(`API Response for ${type}: ${JSON.stringify(response.data)}`);

    let mediaUrls = [];
    if (['ytmp3', 'ytmp4', 'fbdl', 'igdl', 'spotify'].includes(type)) {
      if (response.data.status && response.data.data) {
        const dataArray = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
        mediaUrls = dataArray.map((item, index) => ({
          url: item.url,
          filename: `${type}_${index + 1}_${Date.now()}`
        }));
      }
    } else if (type === 'ytdl') {
      const result = response.data.result?.resultUrl;
      if (result?.video?.length > 0) {
        const highestQualityVideo = result.video.reduce((prev, current) => (prev.quality > current.quality) ? prev : current);
        if (highestQualityVideo.download) {
          mediaUrls.push({ url: highestQualityVideo.download, filename: `ytdl_video_${Date.now()}`, format: 'mp4' });
        }
      }
      if (result?.audio?.[0]?.download) {
        mediaUrls.push({ url: result.audio[0].download, filename: `ytdl_audio_${Date.now()}`, format: 'mp3' });
      }
    }

    if (mediaUrls.length === 0) {
      throw new Error(`No valid media URLs found in ${type} response`);
    }

    const downloadedMedia = [];
    for (const mediaUrl of mediaUrls) {
      try {
        const mediaResponse = await axios.get(mediaUrl.url, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(mediaResponse.data);
        
        let extension;
        switch (type) {
          case 'ytdl':
            extension = mediaUrl.format; // 'mp4' or 'mp3'
            break;
          case 'igdl':
            extension = buffer[0] === 0xFF && buffer[1] === 0xD8 ? 'jpg' : 'mp4';
            break;
          case 'ytmp3':
          case 'spotify':
            extension = 'mp3';
            break;
          case 'ytmp4':
          case 'fbdl':
            extension = 'mp4';
            break;
          default:
            extension = 'bin'; // fallback extension
        }
        
        const filename = `${mediaUrl.filename}.${extension}`;
        const tempFilePath = path.join(__dirname, '../../temp', filename);
        
        await fs.writeFile(tempFilePath, buffer);

        const fileSize = (await fs.stat(tempFilePath)).size;
        const isDocument = fileSize > MAX_MEDIA_SIZE;

        const media = MessageMedia.fromFilePath(tempFilePath);
        
        await fs.unlink(tempFilePath);

        downloadedMedia.push({ media, isDocument, filename, fileSize });
      } catch (downloadError) {
        logger.error(`Error downloading ${mediaUrl.filename}: ${downloadError.message}`);
      }
    }

    if (downloadedMedia.length === 0) {
      throw new Error(`Failed to download any media for ${type}`);
    }

    return downloadedMedia;
  } catch (error) {
    logger.error(`Error downloading media for ${type}: ${error.message}`);
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
    await message.reply('Download started. Please wait...');

    const downloadedMedia = await downloadMedia(url, type);
    
    logger.info(`${type} downloaded successfully. Attempting to send...`);

    for (const { media, isDocument, filename, fileSize } of downloadedMedia) {
      try {
        let caption = `File: ${filename}\nSize: ${(fileSize / (1024 * 1024)).toFixed(2)} MB`;
        if (isDocument) {
          caption += "\nFile size exceeds 12MB. Sending as document.";
        }

        const sent = await message.reply(media, null, { sendMediaAsDocument: isDocument, caption: caption });
        if (sent) {
          logger.info(`${filename} sent successfully.`);
          await message.reply(`✅ ${filename} sent successfully.`);
        } else {
          throw new Error('Failed to send media');
        }
      } catch (sendError) {
        logger.error(`Error sending ${filename}: ${sendError.message}`);
        await message.reply(`⚠️ Error sending ${filename}. Trying to send as document...`);
        
        try {
          const sent = await message.reply(media, null, { sendMediaAsDocument: true, caption: `File: ${filename}\nSize: ${(fileSize / (1024 * 1024)).toFixed(2)} MB\nSent as document due to sending error.` });
          if (sent) {
            logger.info(`${filename} sent successfully as document.`);
            await message.reply(`✅ ${filename} sent successfully as document.`);
          } else {
            throw new Error('Failed to send media as document');
          }
        } catch (docError) {
          logger.error(`Error sending ${filename} as document: ${docError.message}`);
          await message.reply(`❌ Failed to send ${filename}. You may need to download it manually.`);
        }
      }
    }

    logger.info(`All media for ${type} sent successfully: ${url}`);
    await message.reply(`✅ All media for ${type} sent successfully.`);
  } catch (error) {
    logger.error(`Error in ${type} command:`, error);
    await message.reply(`❌ An error occurred while processing your request: ${error.message}`);
  }
}

export const ytdl = async (message, args) => handleDownload(message, args, 'ytdl');
export const ytmp4 = async (message, args) => handleDownload(message, args, 'ytmp4');
export const ytmp3 = async (message, args) => handleDownload(message, args, 'ytmp3');
export const spotify = async (message, args) => handleDownload(message, args, 'spotify');
export const fbdl = async (message, args) => handleDownload(message, args, 'fbdl');
export const igdl = async (message, args) => handleDownload(message, args, 'igdl');