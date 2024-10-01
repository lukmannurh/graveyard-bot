import pkg from 'whatsapp-web.js';
const { MessageMedia } = pkg;
import axios from 'axios';
import logger from '../utils/logger.js';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import stream from 'stream';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const MAX_MEDIA_SIZE = 14 * 1024 * 1024; // 14MB in bytes

const getTempFilePath = (prefix, extension) => {
    return path.join(os.tmpdir(), `${prefix}-${Date.now()}.${extension}`);
};

const convertToMp3 = async (inputBuffer) => {
    const inputPath = getTempFilePath('input', 'bin');
    const outputPath = getTempFilePath('output', 'mp3');

    await fs.writeFile(inputPath, inputBuffer);

    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .setFfmpegPath(ffmpegInstaller.path)
            .output(outputPath)
            .on('end', async () => {
                const buffer = await fs.readFile(outputPath);
                await fs.unlink(inputPath).catch(err => logger.error('Error deleting input file:', err));
                await fs.unlink(outputPath).catch(err => logger.error('Error deleting output file:', err));
                resolve(buffer);
            })
            .on('error', (err) => {
                logger.error('FFmpeg error:', err);
                fs.unlink(inputPath).catch(err => logger.error('Error deleting input file:', err));
                reject(err);
            })
            .run();
    });
};

const downloadAndSendMedia = async (url, message, caption, isAudio = false) => {
    let tempFilePath = null;
    try {
        logger.info(`Downloading ${isAudio ? 'audio' : 'video'} from URL: ${url}`);
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        let buffer = Buffer.from(response.data, 'binary');

        if (isAudio) {
            logger.info('Converting audio to MP3');
            try {
                buffer = await convertToMp3(buffer);
                logger.info('Audio conversion successful');
            } catch (conversionError) {
                logger.error('Audio conversion failed:', conversionError);
                throw new Error('Failed to convert audio');
            }
        }

        const isLargeFile = buffer.length > MAX_MEDIA_SIZE;
        logger.info(`${isAudio ? 'Audio' : 'Video'} size: ${buffer.length} bytes`);

        const mimeType = isAudio ? 'audio/mpeg' : 'video/mp4';
        const filename = isAudio ? 'tiktok_audio.mp3' : 'tiktok_video.mp4';

        tempFilePath = getTempFilePath('tiktok', isAudio ? 'mp3' : 'mp4');
        await fs.writeFile(tempFilePath, buffer);

        logger.info(`Creating MessageMedia with mimeType: ${mimeType}, filename: ${filename}`);
        const media = MessageMedia.fromFilePath(tempFilePath);

        logger.info(`Sending ${isAudio ? 'audio' : 'video'} as ${isLargeFile || isAudio ? 'document' : 'media'}`);
        await message.reply(media, null, { 
            caption,
            sendMediaAsDocument: isLargeFile || isAudio
        });
        logger.info(`${isAudio ? 'Audio' : 'Video'} sent successfully`);

    } catch (error) {
        logger.error(`Error downloading or sending ${isAudio ? 'audio' : 'video'}:`, error);
        if (error.response) {
            logger.error('Error response:', error.response.status, error.response.statusText);
        }
        await message.reply(`Gagal mengirim ${isAudio ? 'audio' : 'video'} TikTok. Error: ${error.message}`);
    } finally {
        if (tempFilePath) {
            try {
                await fs.unlink(tempFilePath);
                logger.info(`Temporary file deleted: ${tempFilePath}`);
            } catch (unlinkError) {
                logger.error('Error deleting temporary file:', unlinkError);
            }
        }
    }
};

const tiktokDownloader = async (message, args) => {
    logger.info('TikTok downloader function called');
    logger.info('Arguments:', args);

    if (args.length === 0) {
        logger.info('No URL provided');
        await message.reply('Mohon sertakan link TikTok yang ingin diunduh.');
        return;
    }

    const url = args[0];
    const videoApiUrl = `https://mr-apis.com/api/downloader/ttv?url=${encodeURIComponent(url)}`;
    const audioApiUrl = `https://mr-apis.com/api/downloader/tta?url=${encodeURIComponent(url)}`;

    logger.info('Video API URL:', videoApiUrl);
    logger.info('Audio API URL:', audioApiUrl);

    try {
        await message.reply('Sedang memproses video dan audio TikTok...');

        logger.info('Sending API requests');
        let videoResponse, audioResponse;
        try {
            [videoResponse, audioResponse] = await Promise.all([
                axios.get(videoApiUrl),
                axios.get(audioApiUrl)
            ]);
            logger.info('API responses received');
        } catch (apiError) {
            logger.error('Error calling API:', apiError);
            throw apiError;
        }

        const videoData = videoResponse.data;
        const audioData = audioResponse.data;

        logger.info('Video API response:', JSON.stringify(videoData));
        logger.info('Audio API response:', JSON.stringify(audioData));

        if (videoData.status === "success" && videoData.videoUrl) {
            await downloadAndSendMedia(videoData.videoUrl, message, 'Video TikTok');
        } else {
            logger.warn('Invalid video data in API response:', videoData);
            await message.reply('Maaf, tidak dapat mengunduh video TikTok. Data tidak valid.');
        }

        if (audioData.status === "success" && audioData.audioUrl) {
            logger.info('Attempting to download and send audio');
            await downloadAndSendMedia(audioData.audioUrl, message, 'Audio TikTok', true);
        } else {
            logger.warn('Invalid audio data in API response:', audioData);
            await message.reply('Maaf, tidak dapat mengunduh audio dari TikTok. Data tidak valid.');
        }
    } catch (error) {
        logger.error('Error in TikTok downloader:', error);
        if (error.response) {
            logger.error('API Response Error:', error.response.data);
            logger.error('API Response Status:', error.response.status);
            logger.error('API Response Headers:', error.response.headers);
        } else if (error.request) {
            logger.error('No response received:', error.request);
        } else {
            logger.error('Error setting up request:', error.message);
        }
        await message.reply('Terjadi kesalahan saat mengunduh konten TikTok. Mohon coba lagi nanti.');
    }
};

export { tiktokDownloader };