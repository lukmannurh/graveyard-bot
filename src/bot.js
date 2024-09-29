import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import messageHandler from './handlers/messageHandler.js';
import logger from './utils/logger.js';
import { PUPPETEER_ARGS } from './config/index.js';

const client = new Client({
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
});

export const startBot = async () => {
  try {
    await client.initialize();
  } catch (error) {
    logger.error('Failed to start the bot:', error);
    process.exit(1);
  }
};

export const stopBot = async () => {
  await client.destroy();
  logger.info('Bot stopped');
};