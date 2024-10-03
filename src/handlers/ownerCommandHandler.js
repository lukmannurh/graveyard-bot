import * as commands from '../commands/index.js';
import { OWNER_COMMANDS } from '../commands/index.js';
import { PREFIX } from '../config/constants.js';
import logger from '../utils/logger.js';
import authorizeGroup from '../commands/authorizeGroup.js';
import { handleRegularCommand } from './regularCommandHandler.js';
import { handleNonCommandMessage } from './nonCommandHandler.js';
import adventureManager from '../utils/adventureManager.js';

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
  } else if (message.body.startsWith(PREFIX)) {
    // If it's not an owner command but starts with prefix, handle it as a regular command
    const chat = await message.getChat();
    const sender = await message.getContact();
    await handleRegularCommand(message, chat, sender, true);
  } else if (adventureManager.isGameActive(groupId) && /^\d+$/.test(message.body.trim())) {
    // Handle adventure choice for owner
    logger.debug(`Processing owner's adventure choice: ${message.body} for group ${groupId}`);
    try {
      await handleNonCommandMessage(message, await message.getChat(), await message.getContact());
    } catch (error) {
      logger.error('Error processing owner\'s adventure choice:', error);
    }
  } else {
    // Handle other non-command messages from owner
    await handleNonCommandMessage(message, await message.getChat(), await message.getContact());
  }
};