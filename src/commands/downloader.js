import pkg from 'whatsapp-web.js';
const { MessageMedia } = pkg;
import axios from 'axios';
import logger from '../utils/logger.js';

const MAX_VIDEO_SIZE = 14 * 1024 * 1024; // 14MB in bytes
const TIMEOUT = 60000; // 60 seconds timeout

const downloadAndSendVideo = async (url, message) => {
    logger.info('Entering downloadAndSendVideo function');
    try {
        // Step 1: Download video
        logger.info(`Downloading video from URL: ${url}`);
        const response = await axios.get(url, { 
            responseType: 'arraybuffer',
            timeout: TIMEOUT
        });
        logger.info('Video downloaded successfully');
        
        // Step 2: Check video size
        const buffer = Buffer.from(response.data, 'binary');
        const isLargeFile = buffer.length > MAX_VIDEO_SIZE;
        logger.info(`Video size: ${buffer.length} bytes`);

        if (isLargeFile) {
            logger.warn('File size exceeds WhatsApp limit');
            await message.reply('Maaf, ukuran video melebihi batas maksimum yang diizinkan WhatsApp.');
            return;
        }

        // Step 3: Create MessageMedia object
        logger.info('Creating MessageMedia object');
        const media = new MessageMedia('video/mp4', buffer.toString('base64'), 'tiktok_video.mp4');
        logger.info('MessageMedia object created successfully');

        // Step 4: Send video
        logger.info('Attempting to send video...');
        try {
            const sent = await message.reply(media, null, { sendMediaAsDocument: false });
            logger.info('Video sent successfully');
            await message.reply('Video berhasil dikirim.');
        } catch (sendError) {
            logger.error('Error sending video:', sendError);
            await message.reply('Gagal mengirim video. Mencoba mengirim sebagai dokumen...');
            try {
                const sentAsDoc = await message.reply(media, null, { sendMediaAsDocument: true });
                logger.info('Video sent as document successfully');
                await message.reply('Video berhasil dikirim sebagai dokumen.');
            } catch (docSendError) {
                logger.error('Error sending video as document:', docSendError);
                await message.reply('Gagal mengirim video sebagai dokumen. Mohon coba lagi nanti.');
            }
        }
    } catch (error) {
        logger.error('Error in downloadAndSendVideo:', error);
        if (error.response) {
            logger.error('Error response:', error.response.status, error.response.statusText);
        }
        await message.reply('Terjadi kesalahan saat mengunduh atau mengirim video. Mohon coba lagi nanti.');
    }
};

const tiktokDownloader = async (message, args) => {
    logger.info('Entering tiktokDownloader function');
    logger.info('Arguments:', args);

    try {
        // Step 1: Check URL
        if (args.length === 0) {
            logger.info('No URL provided');
            await message.reply('Mohon sertakan link TikTok yang ingin diunduh.');
            return;
        }

        const url = args[0];
        logger.info('TikTok URL:', url);
        
        if (!url.includes('tiktok.com')) {
            logger.warn('Invalid TikTok URL');
            await message.reply('URL yang diberikan bukan URL TikTok yang valid.');
            return;
        }

        // Step 2: Prepare API request
        const apiUrl = `https://api.ryzendesu.vip/api/downloader/ttdl?url=${encodeURIComponent(url)}`;
        logger.info('API URL:', apiUrl);

        await message.reply('Sedang memproses video TikTok...');

        // Step 3: Send API request
        logger.info('Sending API request');
        const apiResponse = await axios.get(apiUrl, { 
            timeout: TIMEOUT,
            validateStatus: false
        });
        logger.info('API response received');
        logger.info('API response status:', apiResponse.status);
        logger.info('API response headers:', JSON.stringify(apiResponse.headers));
        logger.info('API response data:', JSON.stringify(apiResponse.data, null, 2));

        // Step 4: Process API response
        const videoData = apiResponse.data;

        if (apiResponse.status !== 200) {
            logger.warn(`API returned non-200 status code: ${apiResponse.status}`);
            await message.reply(`Gagal mengakses API. Status: ${apiResponse.status}`);
            return;
        }

        logger.info('Video data structure:', JSON.stringify(videoData, null, 2));

        // Step 5: Check video data and download
        if (videoData.status === "Success" && videoData.result && videoData.result.video) {
            logger.info('Valid video data received, attempting to download');
            await downloadAndSendVideo(videoData.result.video, message);
        } else {
            logger.warn('Invalid or unexpected video data in API response:', JSON.stringify(videoData, null, 2));
            if (videoData.status === "Error") {
                await message.reply(`Gagal mengunduh video: ${videoData.message || 'Alasan tidak diketahui'}`);
            } else {
                await message.reply('Maaf, tidak dapat mengunduh video TikTok. Format respons API tidak sesuai yang diharapkan.');
            }
        }

    } catch (error) {
        logger.error('Error in tiktokDownloader:', error);
        if (error.response) {
            logger.error('API Response Error:', error.response.data);
            logger.error('API Response Status:', error.response.status);
            logger.error('API Response Headers:', error.response.headers);
            await message.reply(`Terjadi kesalahan saat mengakses API: ${error.response.status} - ${error.response.statusText}`);
        } else if (error.request) {
            logger.error('No response received:', error.request);
            await message.reply('Tidak ada respons dari server API. Mohon coba lagi nanti.');
        } else {
            logger.error('Error setting up request:', error.message);
            await message.reply('Terjadi kesalahan internal saat memproses permintaan Anda.');
        }
    }
};

export { tiktokDownloader };