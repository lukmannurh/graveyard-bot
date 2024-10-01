import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import messageHandler from './handlers/messageHandler.js';
import logger from './utils/logger.js';
import { PUPPETEER_ARGS } from './config/index.js';

let client;

const startBot = async () => {
  try {
    client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        args: PUPPETEER_ARGS,
      },
    });

    client.on('qr', (qr) => {
      qrcode.generate(qr, { small: true });
      logger.info('QR Code received, scan with your phone.');
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

    await client.initialize();
  } catch (error) {
    logger.error('Failed to start the bot:', error);
    // Try to restart after a delay
    setTimeout(() => {
      logger.info('Attempting to restart the bot...');
      startBot();
    }, 5000);
  }
};

const stopBot = async () => {
  if (client) {
    await client.destroy();
    logger.info('Bot stopped');
  }
};

export { startBot, stopBot };