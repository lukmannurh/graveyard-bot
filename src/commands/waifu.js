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
            },
            timeout: 10000 // 10 seconds timeout
        });

        logger.info('API response received');

        if (response.data && response.data.images && response.data.images.length > 0) {
            logger.info(`Found ${response.data.images.length} images`);
            const mediaArray = [];
            for (const image of response.data.images) {
                try {
                    logger.info(`Downloading image from ${image.url}`);
                    const media = await MessageMedia.fromUrl(image.url);
                    mediaArray.push(media);
                } catch (downloadError) {
                    logger.error(`Failed to download image from ${image.url}:`, downloadError);
                }
            }
            logger.info(`Successfully downloaded ${mediaArray.length} images`);

            if (mediaArray.length === 0) {
                await message.reply('Sorry, I couldn\'t download any waifu images. Please try again later.');
            } else if (mediaArray.length === 1) {
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