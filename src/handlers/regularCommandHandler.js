import * as commands from '../commands/index.js';
import { PREFIX, ADMIN_COMMANDS } from '../config/constants.js';
import { isAdmin } from '../utils/adminChecker.js';
import logger from '../utils/logger.js';

export const handleRegularCommand = async (message, chat, sender) => {
  const [command, ...args] = message.body.slice(PREFIX.length).trim().split(/ +/);
  const commandName = command.toLowerCase();

  logger.info(`Regular command received: ${commandName}`);

  const commandFunction = commands[commandName];
  if (commandFunction) {
    if (ADMIN_COMMANDS.includes(commandName) && !isAdmin(chat, sender)) {
      await message.reply('Anda tidak memiliki izin untuk menggunakan perintah ini.');
      return;
    }

    logger.info(`Executing command: ${commandName}`);
    try {
      if (commandName === 'getpp') {
        await commandFunction(message);
      } else {
        await commandFunction(message, args);
      }
      logger.info(`Command ${commandName} executed successfully`);
    } catch (error) {
      logger.error(`Error executing command ${commandName}:`, error);
      await message.reply(`Terjadi kesalahan saat menjalankan perintah ${commandName}. Mohon coba lagi nanti.`);
    }
  } else {
    logger.warn(`Unknown command: ${commandName}`);
    await message.reply('Perintah tidak dikenali. Gunakan .menu untuk melihat daftar perintah yang tersedia.');
  }
};