import * as commands from '../commands/index.js';
import { GENERAL_COMMANDS, ADMIN_COMMANDS, OWNER_COMMANDS } from '../commands/index.js';
import { PREFIX } from '../config/constants.js';
import { isAdmin } from '../utils/adminChecker.js';
import logger from '../utils/logger.js';

export const handleRegularCommand = async (message, chat, sender, isOwner) => {
  const [command, ...args] = message.body.slice(PREFIX.length).trim().split(/ +/);
  const commandName = command.toLowerCase();

  logger.info(`Attempting to execute command: ${commandName}`);
  logger.info(`Available commands: ${Object.keys(commands)}`);

  const isUserAdmin = isAdmin(chat, sender);

  const availableCommands = [
    ...GENERAL_COMMANDS,
    ...(isUserAdmin || isOwner ? ADMIN_COMMANDS : []),
    ...(isOwner ? OWNER_COMMANDS : [])
  ];

  if (availableCommands.includes(commandName)) {
    const commandFunction = commands[commandName];
    if (commandFunction) {
      logger.info(`Found command function for: ${commandName}`);
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
    logger.warn(`Unknown command: ${commandName}`);
    await message.reply('Perintah tidak dikenali. Gunakan .menu untuk melihat daftar perintah yang tersedia.');
  }
};