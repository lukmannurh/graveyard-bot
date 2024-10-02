import * as commands from '../commands/index.js';
import { OWNER_COMMANDS } from '../commands/index.js';
import { PREFIX } from '../config/constants.js';
import logger from '../utils/logger.js';
import authorizeGroup from '../commands/authorizeGroup.js';

export const handleOwnerCommand = async (message, groupId) => {
  const [command, ...args] = message.body.slice(PREFIX.length).trim().split(/ +/);
  const commandName = command.toLowerCase();

  logger.info('Owner command received:', commandName);

  if (commandName === 'authorize') {
    try {
      await authorizeGroup(message, args);
      logger.info('Authorize command executed successfully');
    } catch (error) {
      logger.error('Error executing authorize command:', error);
      await message.reply('Terjadi kesalahan saat menjalankan perintah authorize. Mohon coba lagi.');
    }
  } else if (OWNER_COMMANDS.includes(commandName)) {
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
      await message.reply('Perintah owner tidak dikenali. Gunakan .menu untuk melihat daftar perintah yang tersedia.');
    }
  } else {
    // If it's not an owner command, handle it as a regular command
    await handleRegularCommand(message, await message.getChat(), await message.getContact(), true);
  }
};