import pkg from 'whatsapp-web.js';
const { MessageMedia } = pkg;
import axios from 'axios';
import logger from '../utils/logger.js';

const MAX_VIDEO_SIZE = 14 * 1024 * 1024; // 14MB in bytes
const TIMEOUT = 60000; // 60 seconds timeout

const downloadAndSendVideo = async (url, message) => {
    try {
        logger.info(`Downloading video from URL: ${url}`);
        const response = await axios.get(url, { 
            responseType: 'arraybuffer',
            timeout: TIMEOUT
        });
        const buffer = Buffer.from(response.data, 'binary');

        const isLargeFile = buffer.length > MAX_VIDEO_SIZE;
        logger.info(`Video size: ${buffer.length} bytes`);

        const media = new MessageMedia('video/mp4', buffer.toString('base64'), 'tiktok_video.mp4');

        logger.info(`Sending video as ${isLargeFile ? 'document' : 'media'}`);
        await message.reply(media, null, { 
            sendMediaAsDocument: isLargeFile
        });
        logger.info('Video sent successfully');

    } catch (error) {
        logger.error('Error downloading or sending video:', error);
        if (error.response) {
            logger.error('Error response:', error.response.status, error.response.statusText);
        }
        throw error;
    }
};

const tiktokDownloader = async (message, args) => {
    logger.info('TikTok downloader function called');
    logger.info('Arguments:', args);

    try {
        if (args.length === 0) {
            logger.info('No URL provided');
            await message.reply('Mohon sertakan link TikTok yang ingin diunduh.');
            return;
        }

        const url = args[0];
        if (!url.includes('tiktok.com')) {
            logger.warn('Invalid TikTok URL');
            await message.reply('URL yang diberikan bukan URL TikTok yang valid.');
            return;
        }

        const apiUrl = `https://api.ryzendesu.vip/api/downloader/ttdl?url=${encodeURIComponent(url)}`;

        logger.info('API URL:', apiUrl);

        await message.reply('Sedang memproses video TikTok...');

        logger.info('Sending API request');
        const apiResponse = await axios.get(apiUrl, { timeout: TIMEOUT });
        logger.info('API response received');

        const videoData = apiResponse.data;

        logger.info('API response:', JSON.stringify(videoData));

        if (videoData.status === "Success" && videoData.result && videoData.result.video) {
            await downloadAndSendVideo(videoData.result.video, message);
        } else {
            logger.warn('Invalid video data in API response:', videoData);
            await message.reply('Maaf, tidak dapat mengunduh video TikTok. Data tidak valid.');
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