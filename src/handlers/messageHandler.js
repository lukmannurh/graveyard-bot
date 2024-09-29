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

    console.log('Message received from:', userId);
    console.log('OWNER_NUMBER in messageHandler:', OWNER_NUMBER);
    console.log('Group ID:', groupId);

    const cleanUserId = userId.replace('@c.us', '');
    console.log('Cleaned userId:', cleanUserId);
    console.log('Is owner?', cleanUserId === OWNER_NUMBER);

    if (cleanUserId === OWNER_NUMBER) {
      console.log('Owner detected, processing command...');
      const [command, ...args] = message.body.split(' ');
      if (command.startsWith(PREFIX)) {
        const commandName = command.slice(PREFIX.length).toLowerCase();
        console.log('Command received:', commandName);
        if (commandName === 'authorize') {
          console.log('Authorize command detected, args:', args);
          await commands.authorizeGroup(message, args);
        } else {
          const commandFunction = commands[commandName];
          if (commandFunction) {
            await commandFunction(message, args);
          }
        }
      }
    } else {
      const isAuthorized = await isGroupAuthorized(groupId);
      console.log('Is group authorized?', isAuthorized);
      
      if (!isAuthorized) {
        console.log('Unauthorized group, ignoring message');
        return;
      }

      // Check if user is banned
      if (isUserBanned(groupId, userId)) {
        logger.info(`Banned user ${sender.id.user} attempted to send a message in group ${chat.name}`);
        await logViolation(groupId, userId, "Attempted to send message while banned");
        
        try {
          await message.delete(true);
          logger.info(`Deleted message from banned user ${sender.id.user} in group ${chat.name}`);
        } catch (deleteError) {
          logger.error('Failed to delete message from banned user:', deleteError);
        }

        await sender.sendMessage("Anda sedang dalam status ban di grup ini. Pesan Anda telah dihapus. Ban akan berakhir dalam 1 jam.");
        return;
      }

      logger.info(`Received message in group: ${chat.name}, ID: ${groupId}`);

      const userStatus = await checkUserStatus(groupId, userId);

      const [command, ...args] = message.body.split(' ');
      if (!command.startsWith(PREFIX)) {
        // Check for forbidden words in non-command messages
        const forbiddenCheck = checkForbiddenWord(message.body, userId);
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
    }
  } catch (error) {
    console.error('Error in messageHandler:', error);
    logger.error('Error in messageHandler:', error);
  }
};

export default messageHandler;