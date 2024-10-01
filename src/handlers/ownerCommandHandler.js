import * as commands from '../commands/index.js';
import { PREFIX } from '../config/constants.js';
import logger from '../utils/logger.js';

export const handleOwnerCommand = async (message, groupId) => {
  const [command, ...args] = message.body.slice(PREFIX.length).trim().split(/ +/);
  const commandName = command.toLowerCase();

  logger.info('Owner command received:', commandName);

  if (commandName === 'authorize') {
    logger.info('Authorize command detected, args:', args);
    await commands.authorizeGroup(message, args);
  } else {
    const commandFunction = commands[commandName];
    if (commandFunction) {
      logger.info(`Executing owner command: ${commandName}`);
      try {
        await commandFunction(message, args);
        logger.info(`Owner command ${commandName} executed successfully`);
      } catch (error) {
        logger.error(`Error executing owner command ${commandName}:`, error);
        await message.reply(`Terjadi kesalahan saat menjalankan perintah ${commandName}. Mohon coba lagi nanti.`);
      }
    } else {
      logger.warn(`Unknown owner command: ${commandName}`);
      await message.reply('Perintah tidak dikenali. Gunakan .menu untuk melihat daftar perintah yang tersedia.');
    }
  }
};