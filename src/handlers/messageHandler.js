// messageHandler.js

import * as commands from '../commands/index.js';
import { isAdmin } from '../utils/adminChecker.js';
import { PREFIX, ADMIN_COMMANDS, OWNER_COMMANDS, OWNER_NUMBER } from '../config/index.js';
import { checkForbiddenWord, getForbiddenWordResponse } from '../utils/wordFilter.js';
import { isGroupAuthorized } from '../utils/authorizedGroups.js';
import { isUserBanned, checkUserStatus, warnUser, logViolation } from '../utils/enhancedModerationSystem.js';
import logger from '../utils/logger.js';

const messageHandler = async (message) => {
  try {
    const chat = await message.getChat();
    if (!chat.isGroup) return;

    const sender = await message.getContact();
    const groupId = chat.id._serialized;
    const userId = sender.id._serialized;

    // Check if user is banned
    if (isUserBanned(groupId, userId)) {
      logger.info(`Banned user ${sender.id.user} attempted to send a message in group ${chat.name}`);
      await logViolation(groupId, userId, "Attempted to send message while banned");
      
      // Delete the message immediately
      try {
        await message.delete(true);
        logger.info(`Deleted message from banned user ${sender.id.user} in group ${chat.name}`);
      } catch (deleteError) {
        logger.error('Failed to delete message from banned user:', deleteError);
      }

      // Notify the user privately
      await sender.sendMessage("Anda sedang dalam status ban di grup ini. Pesan Anda telah dihapus. Ban akan berakhir dalam 1 jam.");
      return;
    }

    // Rest of the message handling logic
    logger.info(`Received message in group: ${chat.name}, ID: ${groupId}`);

    const userStatus = await checkUserStatus(groupId, userId);

    const [command, ...args] = message.body.split(' ');
    if (!command.startsWith(PREFIX)) {
      // Check for forbidden words in non-command messages
      const forbiddenCheck = checkForbiddenWord(message.body);
      if (forbiddenCheck.found) {
        const updatedStatus = await warnUser(groupId, userId);
        await message.reply(getForbiddenWordResponse(forbiddenCheck.word, forbiddenCheck.lowercaseWord));
        
        if (updatedStatus.banned) {
          await message.reply("Anda telah mencapai batas peringatan dan sekarang di-ban dari grup ini selama 1 jam.");
          await logViolation(groupId, userId, `Banned due to repeated use of forbidden word: ${forbiddenCheck.word}`);
        } else {
          await message.reply(`Peringatan ${updatedStatus.warnings}/5. Hati-hati dalam penggunaan kata-kata.`);
          await logViolation(groupId, userId, `Warned for using forbidden word: ${forbiddenCheck.word}`);
        }
        
        return;
      }
      return; // Exit if it's not a command and no forbidden words
    }

    const commandName = command.slice(PREFIX.length).toLowerCase();

    // Check if the group is authorized for other commands
    if (!isGroupAuthorized(chat.id._serialized)) {
      logger.warn(`Unauthorized access attempt in group: ${chat.name}, ID: ${chat.id._serialized}`);
      return;
    }

    // Handle commands
    const commandFunction = commands[commandName];
    if (commandFunction) {
      if ((ADMIN_COMMANDS.includes(commandName) && !isAdmin(chat, sender)) ||
          (OWNER_COMMANDS.includes(commandName) && sender.id.user !== OWNER_NUMBER)) {
        await message.reply('Anda tidak memiliki izin untuk menggunakan perintah ini.');
        return;
      }
      await commandFunction(message, args);
    }
  } catch (error) {
    logger.error('Error in messageHandler:', error);
  }
};

export default messageHandler;