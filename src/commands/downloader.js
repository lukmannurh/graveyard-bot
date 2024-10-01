import pkg from 'whatsapp-web.js';
const { MessageMedia } = pkg;
import axios from 'axios';
import logger from '../utils/logger.js';

const tiktokDownloader = async (message, args) => {
    if (args.length === 0) {
        await message.reply('Mohon sertakan link TikTok yang ingin diunduh.');
        return;
    }

    const url = args[0];
    const videoApiUrl = `https://mr-apis.com/api/downloader/ttv?url=${encodeURIComponent(url)}`;
    const audioApiUrl = `https://mr-apis.com/api/downloader/tta?url=${encodeURIComponent(url)}`;

    try {
        await message.reply('Sedang memproses video dan audio TikTok...');

        logger.info(`Attempting to download TikTok content from URL: ${url}`);

        const [videoResponse, audioResponse] = await Promise.all([
            axios.get(videoApiUrl),
            axios.get(audioApiUrl)
        ]);

        logger.info('API responses received');

        const videoData = videoResponse.data;
        const audioData = audioResponse.data;

        logger.info('Video API response:', JSON.stringify(videoData));
        logger.info('Audio API response:', JSON.stringify(audioData));

        if (videoData.status && videoData.result && videoData.result.video_url) {
            const videoUrl = videoData.result.video_url;
            const caption = videoData.result.caption || 'Video TikTok';

            logger.info(`Attempting to download video from URL: ${videoUrl}`);
            const videoMedia = await MessageMedia.fromUrl(videoUrl);
            logger.info('Video successfully downloaded');

            await message.reply(videoMedia, null, { caption });
            logger.info('Video sent successfully');
        } else {
            logger.warn('Failed to get video URL from API response');
            await message.reply('Maaf, tidak dapat mengunduh video TikTok. Pastikan link yang Anda berikan valid.');
        }

        if (audioData.status && audioData.result && audioData.result.audio_url) {
            const audioUrl = audioData.result.audio_url;
            logger.info(`Attempting to download audio from URL: ${audioUrl}`);
            const audioMedia = await MessageMedia.fromUrl(audioUrl, { unsafeMime: true });
            audioMedia.filename = 'tiktok_audio.mp3';
            logger.info('Audio successfully downloaded');

            await message.reply(audioMedia, null, { caption: 'Audio dari TikTok' });
            logger.info('Audio sent successfully');
        } else {
            logger.warn('Failed to get audio URL from API response');
            await message.reply('Maaf, tidak dapat mengunduh audio dari TikTok.');
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