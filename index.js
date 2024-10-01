import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { startBot } from './src/bot.js';
import logger from './src/utils/logger.js';
import { PORT } from './src/config/index.js';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffmpeg from 'fluent-ffmpeg';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const app = express();

// Middleware
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  logger.error('Uncaught Exception:', error);
  // Instead of exiting, we'll try to recover
  setTimeout(() => {
    logger.info('Attempting to recover from uncaught exception...');
    startBot().catch(startError => {
      logger.error('Failed to restart bot after uncaught exception:', startError);
    });
  }, 5000);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Instead of exiting, we'll log and continue
});

// Start the bot
logger.info('Starting the bot...');
startBot().catch(error => {
  logger.error('Failed to start the bot:', error);
});

// Start the server
const server = app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
  });
});

logger.info('Application started successfully');

// Memory usage logging
setInterval(() => {
  const used = process.memoryUsage();
  logger.info('Memory usage: ' + JSON.stringify(used));
}, 300000); // Log every 5 minutes