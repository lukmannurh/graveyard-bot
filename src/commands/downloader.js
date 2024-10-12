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
const MAX_DOCUMENT_SIZE = 12 * 1024 * 1024; // 12MB

async function downloadMedia(url, type) {
  try {
    const response = await axios.get(`${API_BASE_URL}/${type}`, { params: { url } });
    logger.debug(`API Response for ${type}: ${JSON.stringify(response.data)}`);

    let mediaUrls = [];
    if (['ytmp3', 'ytmp4'].includes(type)) {
      if (response.data.url) {
        mediaUrls.push({ url: response.data.url, filename: `${type}_${Date.now()}.${type === 'ytmp3' ? 'mp3' : 'mp4'}` });
      }
    } else if (type === 'ytdl') {
      const result = response.data.result?.resultUrl;
      if (result?.video?.length > 0) {
        const highestQualityVideo = result.video.reduce((prev, current) => (prev.quality > current.quality) ? prev : current);
        if (highestQualityVideo.download) {
          mediaUrls.push({ url: highestQualityVideo.download, filename: `ytdl_video_${Date.now()}.mp4` });
        }
      }
      if (result?.audio?.[0]?.download) {
        mediaUrls.push({ url: result.audio[0].download, filename: `ytdl_audio_${Date.now()}.mp3` });
      }
    } else if (type === 'fbdl') {
      if (response.data.status && response.data.data?.[0]?.url) {
        mediaUrls.push({ url: response.data.data[0].url, filename: `fbdl_${Date.now()}.mp4` });
      }
    } else if (type === 'igdl') {
      if (response.data.status && response.data.data?.length > 0) {
        response.data.data.forEach((item, index) => {
          if (item.url) {
            const extension = item.url.split('.').pop().split('?')[0];
            mediaUrls.push({ url: item.url, filename: `igdl_${index + 1}_${Date.now()}.${extension}` });
          }
        });
      }
    } else if (response.data.data?.url) {
      mediaUrls.push({ url: response.data.data.url, filename: `${type}_${Date.now()}.mp4` });
    }

    if (mediaUrls.length === 0) {
      throw new Error(`No valid media URLs found in ${type} response`);
    }

    const downloadedMedia = [];
    for (const mediaUrl of mediaUrls) {
      try {
        const mediaResponse = await axios.get(mediaUrl.url, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(mediaResponse.data);
        
        const tempFilePath = path.join(__dirname, '../../temp', mediaUrl.filename);
        await fs.writeFile(tempFilePath, buffer);

        const fileSize = (await fs.stat(tempFilePath)).size;
        const isDocument = fileSize > MAX_DOCUMENT_SIZE;

        const media = MessageMedia.fromFilePath(tempFilePath);
        
        await fs.unlink(tempFilePath);

        downloadedMedia.push({ media, isDocument, filename: mediaUrl.filename });
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

    for (const { media, isDocument, filename } of downloadedMedia) {
      try {
        const sent = await message.reply(media, null, { sendMediaAsDocument: isDocument, caption: filename });
        if (sent) {
          logger.info(`${filename} sent successfully.`);
        } else {
          throw new Error('Failed to send media');
        }
      } catch (sendError) {
        logger.error(`Error sending ${filename}: ${sendError.message}`);
        await message.reply(`Download successful, but there was an error sending ${filename}. Trying to send as document...`);
        
        try {
          const sent = await message.reply(media, null, { sendMediaAsDocument: true, caption: filename });
          if (sent) {
            logger.info(`${filename} sent successfully as document.`);
          } else {
            throw new Error('Failed to send media as document');
          }
        } catch (docError) {
          logger.error(`Error sending ${filename} as document: ${docError.message}`);
          await message.reply(`Failed to send ${filename}. You may need to download it manually.`);
        }
      }
    }

    logger.info(`All media for ${type} sent successfully: ${url}`);
  } catch (error) {
    logger.error(`Error in ${type} command:`, error);
    await message.reply(`An error occurred while processing your request: ${error.message}`);
  }
}

export const ytdl = async (message, args) => handleDownload(message, args, 'ytdl');
export const ytmp4 = async (message, args) => handleDownload(message, args, 'ytmp4');
export const ytmp3 = async (message, args) => handleDownload(message, args, 'ytmp3');
export const spotify = async (message, args) => handleDownload(message, args, 'spotify');
export const fbdl = async (message, args) => handleDownload(message, args, 'fbdl');
export const igdl = async (message, args) => handleDownload(message, args, 'igdl');