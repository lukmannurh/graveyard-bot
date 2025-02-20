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
import groupStats from './src/utils/groupStats.js';

// Set up FFmpeg path
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const app = express();

// Middleware
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
);

// Global error handlers
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  setTimeout(() => {
    logger.info('Attempting to recover from uncaught exception...');
    startBot().catch((startError) => {
      logger.error('Failed to restart bot after uncaught exception:', startError);
    });
  }, 5000);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

(async () => {
  try {
    // Muat data petualangan dan statistik grup
    await adventureManager.loadAdventures();
    await groupStats.loadStats();
    logger.info('Adventures and stats loaded');

    // Start bot
    logger.info('Starting the bot...');
    await startBot();
    
    // Start HTTP server
    const server = app.listen(PORT, () =>
      logger.info(`Server running on port ${PORT}`)
    );

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      logger.info(`${signal} signal received: closing HTTP server and stopping bot`);
      server.close(() => {
        logger.info('HTTP server closed');
        stopBot()
          .then(() => {
            logger.info('Bot stopped');
            process.exit(0);
          })
          .catch((error) => {
            logger.error('Error stopping bot:', error);
            process.exit(1);
          });
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    logger.info('Application started successfully');

    // Memory usage logging every 5 minutes
    setInterval(() => {
      const used = process.memoryUsage();
      logger.info('Memory usage: ' + JSON.stringify(used));
    }, 300000);
  } catch (error) {
    logger.error('Error during startup:', error);
    process.exit(1);
  }
})();
