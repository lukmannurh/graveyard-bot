import pkg from 'whatsapp-web.js';
const { MessageMedia } = pkg;
import axios from 'axios';
import logger from '../utils/logger.js';
import { WAIFU_API_TOKEN } from '../config/index.js';

const WAIFU_API_URL = 'https://api.waifu.im/search';
const MAX_IMAGES = 10;

const downloadImageWithTimeout = async (url, timeout = 30000) => {
    return new Promise(async (resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(`Download timeout for ${url}`));
        }, timeout);

        try {
            const media = await MessageMedia.fromUrl(url);
            clearTimeout(timer);
            resolve(media);
        } catch (error) {
            clearTimeout(timer);
            reject(error);
        }
    });
};

const checkSendMediaPermission = async (chat) => {
    return chat.isGroup;
};

const waifu = async (message, args) => {
    console.log('Waifu function called');
    logger.info('Waifu function called');
    try {
        let imageCount = 1;
        if (args.length > 0 && !isNaN(args[0])) {
            imageCount = Math.min(parseInt(args[0]), MAX_IMAGES);
        }
        console.log(`Requesting ${imageCount} images`);
        logger.info(`Requesting ${imageCount} images`);

        console.log('WAIFU_API_TOKEN:', WAIFU_API_TOKEN);
        logger.info('WAIFU_API_TOKEN loaded');

        const chat = await message.getChat();
        if (!(await checkSendMediaPermission(chat))) {
            await message.reply("I don't have permission to send media in this group.");
            return;
        }

        let response;
        try {
            response = await axios.get(WAIFU_API_URL, {
                params: {
                    included_tags: 'waifu',
                    height: '>=2000',
                    many: true,
                    limit: Math.max(imageCount, 1)
                },
                headers: {
                    'Authorization': `Bearer ${WAIFU_API_TOKEN}`
                },
                timeout: 15000
            });
            console.log('API response received');
            logger.info('API response received');
        } catch (apiError) {
            console.error('Error calling API:', apiError);
            logger.error('Error calling API:', apiError);
            throw apiError;
        }

        if (response.data && response.data.images && response.data.images.length > 0) {
            console.log(`Found ${response.data.images.length} images`);
            logger.info(`Found ${response.data.images.length} images`);
            const mediaArray = [];
            for (const image of response.data.images) {
                try {
                    console.log(`Downloading image from ${image.url}`);
                    logger.info(`Downloading image from ${image.url}`);
                    const media = await downloadImageWithTimeout(image.url);
                    mediaArray.push(media);
                } catch (downloadError) {
                    console.error(`Failed to download image from ${image.url}:`, downloadError);
                    logger.error(`Failed to download image from ${image.url}:`, downloadError);
                }
            }
            console.log(`Successfully downloaded ${mediaArray.length} images`);
            logger.info(`Successfully downloaded ${mediaArray.length} images`);

            if (mediaArray.length === 0) {
                await message.reply('Sorry, I couldn\'t download any waifu images. Please try again later.');
            } else {
                console.log(`Attempting to send ${mediaArray.length} images as an album`);
                logger.info(`Attempting to send ${mediaArray.length} images as an album`);
                try {
                    const chat = await message.getChat();
                    const sentMessage = await chat.sendMessage(mediaArray, {
                        caption: `Here are ${mediaArray.length} waifu images for you!`,
                        media: mediaArray
                    });
                    console.log(`Album sent successfully, message ID:`, sentMessage.id);
                    logger.info(`Album sent successfully, message ID:`, sentMessage.id);
                } catch (sendError) {
                    console.error(`Error sending album:`, sendError);
                    logger.error(`Error sending album:`, sendError);
                    await message.reply('An error occurred while sending the waifu images. Please try again later.');
                }
            }
        } else {
            console.warn('No images found in API response');
            logger.warn('No images found in API response');
            await message.reply('Sorry, I couldn\'t find any waifu images at the moment. Please try again later.');
        }
    } catch (error) {
        console.error('Error in waifu command:', error);
        logger.error('Error in waifu command:', error);
        if (error.response) {
            console.error('API Response Error:', error.response.data);
            console.error('API Response Status:', error.response.status);
            console.error('API Response Headers:', error.response.headers);
            logger.error('API Response Error:', error.response.data);
            logger.error('API Response Status:', error.response.status);
            logger.error('API Response Headers:', error.response.headers);
        } else if (error.request) {
            console.error('No response received:', error.request);
            logger.error('No response received:', error.request);
        } else {
            console.error('Error setting up request:', error.message);
            logger.error('Error setting up request:', error.message);
        }
        await message.reply('An error occurred while fetching the waifu images. Please try again later.');
    }
};

export default waifu;