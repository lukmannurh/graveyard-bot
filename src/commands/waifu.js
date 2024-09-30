import pkg from 'whatsapp-web.js';
const { MessageMedia } = pkg;
import axios from 'axios';
import logger from '../utils/logger.js';
import { WAIFU_API_TOKEN } from '../config/index.js';

const WAIFU_API_URL = 'https://api.waifu.im/search';
const MAX_IMAGES = 10;

const waifu = async (message, args) => {
    try {
        logger.info('Waifu command initiated');
        let imageCount = 1;
        if (args.length > 0 && !isNaN(args[0])) {
            imageCount = Math.min(parseInt(args[0]), MAX_IMAGES);
        }
        logger.info(`Requesting ${imageCount} images`);

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

        logger.info('API response received');

        if (response.data && response.data.images && response.data.images.length > 0) {
            logger.info(`Found ${response.data.images.length} images`);
            const mediaPromises = response.data.images.map(async (image) => {
                logger.info(`Downloading image from ${image.url}`);
                return MessageMedia.fromUrl(image.url);
            });

            const mediaArray = await Promise.all(mediaPromises);
            logger.info('All images downloaded');

            if (mediaArray.length === 1) {
                logger.info('Sending single image');
                await message.reply(mediaArray[0], null, { caption: 'Here\'s your waifu!' });
            } else {
                logger.info(`Sending ${mediaArray.length} images`);
                await message.reply(mediaArray, null, { caption: `Here are ${mediaArray.length} waifus for you!` });
            }
            logger.info('Images sent successfully');
        } else {
            logger.warn('No images found in API response');
            await message.reply('Sorry, I couldn\'t find any waifu images at the moment. Please try again later.');
        }
    } catch (error) {
        logger.error('Error in waifu command:', error);
        if (error.response) {
            logger.error('API Response Error:', error.response.data);
            logger.error('API Response Status:', error.response.status);
            logger.error('API Response Headers:', error.response.headers);
        } else if (error.request) {
            logger.error('No response received:', error.request);
        } else {
            logger.error('Error setting up request:', error.message);
        }
        await message.reply('An error occurred while fetching the waifu images. Please try again later.');
    }
};

export default waifu;