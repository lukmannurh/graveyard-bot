import sharp from 'sharp';
import FileType from 'file-type';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'whatsapp-web.js';
const { MessageMedia } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function stickerCommand(message) {
  try {
    // Check if the message has media
    if (!message.hasMedia) {
      await message.reply('Silakan kirim gambar dengan caption .s untuk mengubahnya menjadi stiker.');
      return;
    }

    // Download the media
    const media = await message.downloadMedia();

    // Check if the media is an image
    const fileType = await FileType.fromBuffer(Buffer.from(media.data, 'base64'));
    if (!fileType || !fileType.mime.startsWith('image/')) {
      await message.reply('File yang dikirim bukan gambar. Silakan kirim gambar untuk diubah menjadi stiker.');
      return;
    }

    // Ensure the /temp directory exists
    const tempDir = path.join(__dirname, '../../temp');
    await fs.mkdir(tempDir, { recursive: true });

    // Process the image
    const imageBuffer = Buffer.from(media.data, 'base64');
    const stickerBuffer = await sharp(imageBuffer)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .webp()
      .toBuffer();

    // Save the sticker temporarily
    const stickerPath = path.join(tempDir, `sticker_${Date.now()}.webp`);
    await fs.writeFile(stickerPath, stickerBuffer);

    // Send the sticker as a reply
    await message.reply(MessageMedia.fromFilePath(stickerPath), { sendMediaAsSticker: true });

    // Delete the temporary file
    await fs.unlink(stickerPath);

    console.log('Sticker sent successfully');
  } catch (error) {
    console.error('Error in stickerCommand:', error);
    await message.reply('Terjadi kesalahan saat membuat stiker. Silakan coba lagi nanti.');
  }
}

export default stickerCommand;