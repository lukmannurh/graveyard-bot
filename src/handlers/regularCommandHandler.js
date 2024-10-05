import * as commands from '../commands/index.js';
import { GENERAL_COMMANDS, ADMIN_COMMANDS } from '../commands/index.js';
import { PREFIX } from '../config/constants.js';
import logger from '../utils/logger.js';

export const handleRegularCommand = async (message, chat, sender, isGroupAdmin) => {
  const [command, ...args] = message.body.slice(PREFIX.length).trim().split(/ +/);
  const commandName = command.toLowerCase();

  logger.info(`Attempting to execute command: ${commandName}`);
  logger.info(`Available commands: ${Object.keys(commands)}`);
  logger.info(`Is group admin: ${isGroupAdmin}`);

  const availableCommands = [
    ...GENERAL_COMMANDS,
    ...(isGroupAdmin ? ADMIN_COMMANDS : [])
  ];

  logger.info(`Available commands for this user: ${availableCommands}`);

  if (availableCommands.includes(commandName)) {
    const commandFunction = commands[commandName];
    logger.info(`Command function for ${commandName}: ${commandFunction ? 'Found' : 'Not found'}`);
    if (commandFunction) {
      try {
        await commandFunction(message, args);
        logger.info(`Command ${commandName} executed successfully`);
      } catch (error) {
        logger.error(`Error executing command ${commandName}:`, error);
        await message.reply(`Terjadi kesalahan saat menjalankan perintah ${commandName}. Mohon coba lagi nanti.`);
      }
    } else {
      logger.warn(`Command function not found for: ${commandName}`);
      await message.reply('Perintah tidak dapat dieksekusi. Mohon hubungi admin bot.');
    }
  } else {
    logger.warn(`Unknown or unauthorized command: ${commandName}`);
    await message.reply('Perintah tidak dikenali atau Anda tidak memiliki izin untuk menggunakannya. Gunakan .menu untuk melihat daftar perintah yang tersedia.');
  }
};