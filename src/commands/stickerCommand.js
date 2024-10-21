import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'whatsapp-web.js';
const { MessageMedia } = pkg;
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

async function stickerCommand(message) {
  try {
    logger.info('Sticker command initiated');

    if (!message.hasMedia) {
      logger.info('No media attached to the message');
      await message.reply('Please send an image or video with the caption .s to convert it to a sticker.');
      return;
    }

    logger.info('Attempting to download media');
    const media = await message.downloadMedia().catch(error => {
      logger.error('Error downloading media:', error);
      throw new Error('Failed to download media');
    });

    if (!media) {
      logger.error('Media download resulted in null');
      await message.reply('Failed to download media. Please try again.');
      return;
    }

    logger.info(`Successfully downloaded media of type: ${media.mimetype}`);

    const tempDir = path.join(__dirname, '../../temp');
    await fs.mkdir(tempDir, { recursive: true });

    if (media.mimetype.startsWith('image/') && media.mimetype !== 'image/gif') {
      await processImage(media, message, tempDir);
    } else {
      await processAnimatedMedia(media, message, tempDir);
    }

  } catch (error) {
    logger.error('Error in stickerCommand:', error);
    await message.reply(`An error occurred: ${error.message}. Please try again later.`);
  }
}

async function processImage(media, message, tempDir) {
  try {
    logger.info('Processing static image');
    const imageBuffer = Buffer.from(media.data, 'base64');
    const stickerBuffer = await sharp(imageBuffer)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .webp()
      .toBuffer();

    const stickerMedia = new MessageMedia('image/webp', stickerBuffer.toString('base64'));
    await message.reply(stickerMedia, null, { sendMediaAsSticker: true });
    logger.info('Static image sticker sent successfully');
  } catch (error) {
    logger.error('Error processing static image:', error);
    throw error;
  }
}

async function processAnimatedMedia(media, message, tempDir) {
  const inputPath = path.join(tempDir, `input_${Date.now()}.${media.mimetype.split('/')[1]}`);
  const outputPath = path.join(tempDir, `sticker_${Date.now()}.webp`);

  try {
    logger.info('Processing animated media');
    await fs.writeFile(inputPath, Buffer.from(media.data, 'base64'));
    logger.info(`Input file saved: ${inputPath}`);

    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .inputOptions(['-t', '5'])
        .outputOptions([
          '-vcodec', 'libwebp',
          '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=white@0.0',
          '-loop', '0',
          '-preset', 'default',
          '-an',
          '-vsync', '0',
          '-ss', '00:00:00'
        ])
        .toFormat('webp')
        .on('end', () => {
          logger.info('FFmpeg process completed');
          resolve();
        })
        .on('error', (err) => {
          logger.error('FFmpeg error:', err);
          reject(err);
        })
        .save(outputPath);
    });

    const stickerBuffer = await fs.readFile(outputPath);
    const stickerMedia = new MessageMedia('image/webp', stickerBuffer.toString('base64'));
    
    await message.reply(stickerMedia, null, { sendMediaAsSticker: true });
    logger.info('Animated sticker sent successfully');

  } catch (error) {
    logger.error('Error processing animated media:', error);
    throw error;
  } finally {
    try {
      await fs.unlink(inputPath);
      await fs.unlink(outputPath);
      logger.info('Temporary files deleted successfully');
    } catch (deleteError) {
      logger.error('Error deleting temporary files:', deleteError);
    }
  }
}

// Fungsi untuk membersihkan file lama di folder temp
async function cleanupTempFolder(tempDir) {
  try {
    const files = await fs.readdir(tempDir);
    const now = Date.now();
    const oneHourAgo = now - 3600000; // 1 jam dalam milidetik

    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const stats = await fs.stat(filePath);

      if (stats.mtimeMs < oneHourAgo) {
        await fs.unlink(filePath);
        logger.info(`Deleted old file: ${filePath}`);
      }
    }
  } catch (error) {
    logger.error("Error cleaning up temp folder:", error);
  }
}

// Jalankan pembersihan setiap jam
setInterval(() => {
  const tempDir = path.join(__dirname, "../../temp");
  cleanupTempFolder(tempDir);
}, 3600000); // Setiap 1 jam

export default stickerCommand;
