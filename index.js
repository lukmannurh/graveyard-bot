import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { startBot, stopBot } from './src/bot.js';
import logger from './src/utils/logger.js';
import { PORT } from './src/config/constants.js';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffmpeg from 'fluent-ffmpeg';
import adventureManager from './src/utils/adventureManager.js';
import messageHandler from './src/handlers/messageHandler.js';
import groupStats from './src/utils/groupStats.js';

await groupStats.loadStats();
await adventureManager.loadAdventures();
logger.info('Adventures loaded');

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const app = express();

// Middleware
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  logger.error('Uncaught Exception:', error);
  // Instead of exiting, we'll try to recover
  setTimeout(() => {
    logger.info('Attempting to recover from uncaught exception...');
    startBot(messageHandler).catch(startError => {
      logger.error('Failed to restart bot after uncaught exception:', startError);
    });
  }, 5000);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the bot
logger.info('Starting the bot...');
startBot(messageHandler).catch(error => {
  logger.error('Failed to start the bot:', error);
});

// Start the server
const server = app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`${signal} signal received: closing HTTP server and stopping bot`);
  server.close(() => {
    logger.info('HTTP server closed');
    stopBot().then(() => {
      logger.info('Bot stopped');
      process.exit(0);
    }).catch((error) => {
      logger.error('Error stopping bot:', error);
      process.exit(1);
    });
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

logger.info('Application started successfully');

// Memory usage logging
setInterval(() => {
  const used = process.memoryUsage();
  logger.info('Memory usage: ' + JSON.stringify(used));
}, 300000); // Log every 5 minutes