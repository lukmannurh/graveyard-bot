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

        const chat = await message.getChat();

        if (videoData.status && videoData.result && videoData.result.video_url) {
            const videoUrl = videoData.result.video_url;
            const caption = videoData.result.caption || 'Video TikTok';

            logger.info('Attempting to download video');
            try {
                const videoResponse = await axios.get(videoUrl, { responseType: 'arraybuffer' });
                const videoBuffer = Buffer.from(videoResponse.data, 'binary');
                const isLargeFile = videoBuffer.length > MAX_MEDIA_SIZE;

                const videoMedia = new MessageMedia(
                    isLargeFile ? 'application/octet-stream' : 'video/mp4',
                    videoBuffer.toString('base64'),
                    isLargeFile ? 'tiktok_video.mp4' : undefined
                );

                logger.info('Video downloaded successfully');
                logger.info(`Video size: ${videoBuffer.length} bytes`);
                
                try {
                    if (isLargeFile) {
                        await chat.sendMessage(videoMedia, { 
                            caption, 
                            sendMediaAsDocument: true
                        });
                    } else {
                        await chat.sendMessage(videoMedia, { caption });
                    }
                    logger.info('Video sent successfully');
                } catch (sendError) {
                    logger.error('Error sending video:', sendError);
                    await message.reply('Gagal mengirim video TikTok. Mohon coba lagi nanti.');
                }
            } catch (videoError) {
                logger.error('Error downloading video:', videoError);
                await message.reply('Gagal mengunduh video TikTok. Mohon coba lagi nanti.');
            }
        } else {
            logger.warn('Invalid video data in API response');
            await message.reply('Maaf, tidak dapat mengunduh video TikTok. Data tidak valid.');
        }

        if (audioData.status && audioData.result && audioData.result.audio_url) {
            const audioUrl = audioData.result.audio_url;
            logger.info('Attempting to download audio');
            try {
                const audioResponse = await axios.get(audioUrl, { responseType: 'arraybuffer' });
                const audioBuffer = Buffer.from(audioResponse.data, 'binary');
                const isLargeFile = audioBuffer.length > MAX_MEDIA_SIZE;

                const audioMedia = new MessageMedia(
                    isLargeFile ? 'application/octet-stream' : 'audio/mpeg',
                    audioBuffer.toString('base64'),
                    isLargeFile ? 'tiktok_audio.mp3' : undefined
                );

                logger.info('Audio downloaded successfully');
                logger.info(`Audio size: ${audioBuffer.length} bytes`);
                
                try {
                    if (isLargeFile) {
                        await chat.sendMessage(audioMedia, { 
                            caption: 'Audio dari TikTok', 
                            sendMediaAsDocument: true
                        });
                    } else {
                        await chat.sendMessage(audioMedia, { caption: 'Audio dari TikTok' });
                    }
                    logger.info('Audio sent successfully');
                } catch (sendError) {
                    logger.error('Error sending audio:', sendError);
                    await message.reply('Gagal mengirim audio TikTok. Mohon coba lagi nanti.');
                }
            } catch (audioError) {
                logger.error('Error downloading audio:', audioError);
                await message.reply('Gagal mengunduh audio TikTok. Mohon coba lagi nanti.');
            }
        } else {
            logger.warn('Invalid audio data in API response');
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