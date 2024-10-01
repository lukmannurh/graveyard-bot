import pkg from 'whatsapp-web.js';
const { MessageMedia } = pkg;
import axios from 'axios';
import logger from '../utils/logger.js';

const MAX_MEDIA_SIZE = 14 * 1024 * 1024; // 14MB in bytes

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
            const videoUrl = videoData.videoUrl;
            logger.info('Attempting to send video URL:', videoUrl);
            try {
                await message.reply(`Video TikTok: ${videoUrl}\n\nJika video tidak dapat diputar, silakan copy link di atas dan paste di browser.`);
                logger.info('Video URL sent successfully');
            } catch (sendError) {
                logger.error('Error sending video URL:', sendError);
                await message.reply('Gagal mengirim link video TikTok. Mohon coba lagi nanti.');
            }
        } else {
            logger.warn('Invalid video data in API response:', videoData);
            await message.reply(`Maaf, tidak dapat mengunduh video TikTok. Data tidak valid.`);
        }

        if (audioData.status === "success" && audioData.audioUrl) {
            const audioUrl = audioData.audioUrl;
            logger.info('Attempting to send audio URL:', audioUrl);
            try {
                await message.reply(`Audio TikTok: ${audioUrl}\n\nJika audio tidak dapat diputar, silakan copy link di atas dan paste di browser.`);
                logger.info('Audio URL sent successfully');
            } catch (sendError) {
                logger.error('Error sending audio URL:', sendError);
                await message.reply('Gagal mengirim link audio TikTok. Mohon coba lagi nanti.');
            }
        } else {
            logger.warn('Invalid audio data in API response:', audioData);
            await message.reply(`Maaf, tidak dapat mengunduh audio dari TikTok. Data tidak valid.`);
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