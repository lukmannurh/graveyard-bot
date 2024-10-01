import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import messageHandler from './handlers/messageHandler.js';
import logger from './utils/logger.js';
import { PUPPETEER_ARGS } from './config/index.js';
import adventureManager from './utils/adventureManager.js';


let client;

const startBot = async () => {
  try {
    logger.info('Initializing WhatsApp client...');
    client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        args: PUPPETEER_ARGS,
      },
    });

    client.on('qr', (qr) => {
      logger.info('QR Code received, scan with your phone.');
      qrcode.generate(qr, { small: true });
    });

    client.on('ready', () => {
      logger.info('WhatsApp Web client is ready!');
    });

    client.on('message', async (message) => {
      try {
        await messageHandler(message);
      } catch (error) {
        logger.error('Error handling message:', error);
      }
    });

    client.on('disconnected', (reason) => {
      logger.warn('WhatsApp Web client was disconnected:', reason);
      // Try to reconnect
      setTimeout(() => {
        logger.info('Attempting to reconnect...');
        startBot();
      }, 5000);
    });

    logger.info('Starting WhatsApp client...');
    await client.initialize();
    logger.info('WhatsApp client initialized successfully');
  } catch (error) {
    logger.error('Failed to start the bot:', error);
    throw error; // Rethrow the error to be caught in index.js
  }
  await adventureManager.loadAdventures();
};

const stopBot = async () => {
  if (client) {
    logger.info('Destroying WhatsApp client...');
    await client.destroy();
    logger.info('WhatsApp client destroyed');
  }
};

export { startBot, stopBot };