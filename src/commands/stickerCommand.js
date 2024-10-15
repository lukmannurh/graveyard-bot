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
    if (!message.hasMedia) {
      await message.reply('Silakan kirim gambar atau video dengan caption .s untuk mengubahnya menjadi stiker.');
      return;
    }

    const media = await message.downloadMedia();
    const tempDir = path.join(__dirname, '../../temp');
    await fs.mkdir(tempDir, { recursive: true });

    if (media.mimetype.startsWith('image/')) {
      await processImage(media, message, tempDir);
    } else if (media.mimetype.startsWith('video/')) {
      await processVideo(media, message, tempDir);
    } else {
      await message.reply('File yang dikirim bukan gambar atau video. Silakan kirim gambar atau video untuk diubah menjadi stiker.');
    }

  } catch (error) {
    logger.error('Error in stickerCommand:', error);
    await message.reply('Terjadi kesalahan saat membuat stiker. Silakan coba lagi nanti.');
  }
}

async function processImage(media, message, tempDir) {
  const imageBuffer = Buffer.from(media.data, 'base64');
  const stickerBuffer = await sharp(imageBuffer)
    .resize(512, 512, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .webp()
    .toBuffer();

  const stickerPath = path.join(tempDir, `sticker_${Date.now()}.webp`);
  await fs.writeFile(stickerPath, stickerBuffer);

  const stickerMedia = MessageMedia.fromFilePath(stickerPath);
  await message.reply(stickerMedia, undefined, { sendMediaAsSticker: true });

  await fs.unlink(stickerPath);
  logger.info('Image sticker sent successfully');
}

async function processVideo(media, message, tempDir) {
  const videoPath = path.join(tempDir, `video_${Date.now()}.mp4`);
  await fs.writeFile(videoPath, Buffer.from(media.data, 'base64'));

  const outputPath = path.join(tempDir, `sticker_${Date.now()}.webp`);

  await new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .setStartTime(0)
      .setDuration(10) // Limit to 10 seconds
      .addOutputOptions([
        '-vcodec', 'libwebp',
        '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=white@0.0,split[a][b];[a]palettegen=reserve_transparent=on:transparency_color=ffffff[p];[b][p]paletteuse',
        '-loop', '0',
        '-preset', 'default',
        '-an',
        '-vsync', '0'
      ])
      .toFormat('webp')
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .save(outputPath);
  });

  const stickerMedia = MessageMedia.fromFilePath(outputPath);
  await message.reply(stickerMedia, undefined, { sendMediaAsSticker: true });

  await fs.unlink(videoPath);
  await fs.unlink(outputPath);
  logger.info('Video sticker sent successfully');
}

export default stickerCommand;