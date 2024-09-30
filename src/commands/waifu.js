import pkg from 'whatsapp-web.js';
const { MessageMedia } = pkg;
import axios from 'axios';
import logger from '../utils/logger.js';
import { WAIFU_API_TOKEN } from '../config/index.js';

const WAIFU_API_URL = 'https://api.waifu.im/search';
const MAX_IMAGES = 10; // Batasan maksimum gambar yang bisa diminta

const waifu = async (message, args) => {
    try {
        let imageCount = 1; // Default jumlah gambar
        if (args.length > 0 && !isNaN(args[0])) {
            imageCount = Math.min(parseInt(args[0]), MAX_IMAGES);
        }

        const response = await axios.get(WAIFU_API_URL, {
            params: {
                included_tags: 'waifu',
                height: '>=2000',
                many: true,
                limit: imageCount
            },
            headers: {
                'Authorization': `Bearer ${WAIFU_API_TOKEN}`
            }
        });

        if (response.data && response.data.images && response.data.images.length > 0) {
            const mediaPromises = response.data.images.map(async (image) => {
                return MessageMedia.fromUrl(image.url);
            });

            const mediaArray = await Promise.all(mediaPromises);

            if (mediaArray.length === 1) {
                await message.reply(mediaArray[0], null, { caption: 'Here\'s your waifu!' });
            } else {
                await message.reply(mediaArray, null, { caption: `Here are ${mediaArray.length} waifus for you!` });
            }
        } else {
            await message.reply('Sorry, I couldn\'t find any waifu images at the moment. Please try again later.');
        }
    } catch (error) {
        logger.error('Error in waifu command:', error);
        await message.reply('An error occurred while fetching the waifu images. Please try again later.');
    }
};

export default waifu;