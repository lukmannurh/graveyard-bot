import axios from 'axios';
import { MessageMedia } from 'whatsapp-web.js';
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

        const [videoResponse, audioResponse] = await Promise.all([
            axios.get(videoApiUrl),
            axios.get(audioApiUrl)
        ]);

        const videoData = videoResponse.data;
        const audioData = audioResponse.data;

        if (videoData.status && videoData.result && videoData.result.video_url) {
            const videoUrl = videoData.result.video_url;
            const caption = videoData.result.caption || 'Video TikTok';

            const videoMedia = await MessageMedia.fromUrl(videoUrl);
            await message.reply(videoMedia, message.from, { caption });
        } else {
            await message.reply('Maaf, tidak dapat mengunduh video TikTok. Pastikan link yang Anda berikan valid.');
        }

        if (audioData.status && audioData.result && audioData.result.audio_url) {
            const audioUrl = audioData.result.audio_url;
            const audioMedia = await MessageMedia.fromUrl(audioUrl, { unsafeMime: true });
            audioMedia.filename = 'tiktok_audio.mp3';
            await message.reply(audioMedia, message.from, { caption: 'Audio dari TikTok' });
        } else {
            await message.reply('Maaf, tidak dapat mengunduh audio dari TikTok.');
        }
    } catch (error) {
        logger.error('Error in TikTok downloader:', error);
        await message.reply('Terjadi kesalahan saat mengunduh konten TikTok. Mohon coba lagi nanti.');
    }
};

export { tiktokDownloader };