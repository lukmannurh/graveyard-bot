import * as commands from '../commands/index.js';
import { isAdmin } from '../utils/adminChecker.js';
import { PREFIX, ADMIN_COMMANDS, OWNER_COMMANDS, OWNER_NUMBER } from '../config/index.js';
import { checkForbiddenWord, getForbiddenWordResponse } from '../utils/wordFilter.js';
import { isGroupAuthorized, addAuthorizedGroup, removeAuthorizedGroup } from '../utils/authorizedGroups.js';
import { isUserBanned, checkUserStatus, warnUser, logViolation } from '../utils/enhancedModerationSystem.js';
import logger from '../utils/logger.js';

const messageHandler = async (message) => {
  try {
    const chat = await message.getChat();
    if (!chat.isGroup) return;

    const sender = await message.getContact();
    const groupId = chat.id._serialized;
    const userId = sender.id._serialized;

    // Check if user is banned (using in-memory cache for speed)
    if (isUserBanned(groupId, userId)) {
      logger.info(`Banned user ${sender.id.user} attempted to send a message in group ${chat.name}`);
      await logViolation(groupId, userId, "Attempted to send message while banned");
      
      // Try to delete the message immediately
      try {
        await message.delete(true);
        logger.info(`Deleted message from banned user ${sender.id.user} in group ${chat.name}`);
      } catch (deleteError) {
        logger.error('Failed to delete message from banned user:', deleteError);
      }

      // Notify the user privately (optional, as it might slow down the process)
      // await message.reply("Anda sedang dalam status ban di grup ini. Pesan Anda telah dihapus.");
      return;
    }

    // Rest of the message handling logic
    logger.info(`Received message in group: ${chat.name}, ID: ${groupId}`);

    const userStatus = await checkUserStatus(groupId, userId);
    
    if (userStatus.timeout) {
      const timeLeft = userStatus.timeout - Date.now();
      if (timeLeft > 0) {
        logger.info(`Timed out user ${sender.id.user} attempted to send a message in group ${chat.name}`);
        await logViolation(groupId, userId, "Attempted to send message during timeout");
        
        // Try to delete the message
        try {
          await message.delete(true);
        } catch (deleteError) {
          logger.error('Failed to delete message from timed out user:', deleteError);
        }

        // Notify the user privately
        await message.reply(`Anda sedang dalam timeout. Silakan tunggu ${Math.ceil(timeLeft / 60000)} menit lagi.`);
        return;
      }
    }

    const [command, ...args] = message.body.split(' ');
    if (!command.startsWith(PREFIX)) {
      // Check for forbidden words in non-command messages
      const forbiddenCheck = checkForbiddenWord(message.body);
      if (forbiddenCheck.found) {
        const updatedStatus = await warnUser(groupId, userId);
        await message.reply(getForbiddenWordResponse(forbiddenCheck.word, forbiddenCheck.lowercaseWord));
        
        if (updatedStatus.banned) {
          await message.reply("Anda telah mencapai batas peringatan dan sekarang di-ban dari grup ini.");
          await logViolation(groupId, userId, `Banned due to repeated use of forbidden word: ${forbiddenCheck.word}`);
        } else {
          await message.reply(`Peringatan ${updatedStatus.warnings}/3. Hati-hati dalam penggunaan kata-kata.`);
          await logViolation(groupId, userId, `Warned for using forbidden word: ${forbiddenCheck.word}`);
        }
        
        return;
      }
      return; // Exit if it's not a command and no forbidden words
    }

    const commandName = command.slice(PREFIX.length).toLowerCase();

    // Handle authorize command separately
    if (commandName === 'authorize') {
      await handleAuthorizeCommand(message, args);
      return;
    }

    // Check if the group is authorized for other commands
    if (!isGroupAuthorized(chat.id._serialized)) {
      logger.warn(`Unauthorized access attempt in group: ${chat.name}, ID: ${chat.id._serialized}`);
      return;
    }

    // Handle other commands
    const commandFunction = commands[commandName];
    if (commandFunction) {
      await executeCommand(commandName, message, args);
    }
  } catch (error) {
    logger.error('Error in messageHandler:', error);
  }
};

const handleAuthorizeCommand = async (message, args) => {
  const sender = await message.getContact();
  if (sender.id.user !== OWNER_NUMBER) {
    await message.reply('Hanya pemilik bot yang dapat menggunakan perintah ini.');
    return;
  }

  const chat = await message.getChat();
  if (args[0] === 'add') {
    await addAuthorizedGroup(chat.id._serialized);
    await message.reply('Grup ini telah diotorisasi untuk menggunakan bot.');
  } else if (args[0] === 'remove') {
    await removeAuthorizedGroup(chat.id._serialized);
    await message.reply('Otorisasi grup ini untuk menggunakan bot telah dicabut.');
  } else {
    await message.reply('Penggunaan: .authorize add/remove');
  }
};

const executeCommand = async (commandName, message, args) => {
  try {
    const sender = await message.getContact();
    const chat = await message.getChat();

    if (ADMIN_COMMANDS.includes(commandName) && !isAdmin(chat, sender)) {
      await message.reply('Anda tidak memiliki izin untuk menggunakan perintah ini.');
      return;
    }

    if (OWNER_COMMANDS.includes(commandName) && sender.id.user !== OWNER_NUMBER) {
      await message.reply('Hanya pemilik bot yang dapat menggunakan perintah ini.');
      return;
    }

    await commands[commandName](message, args);
  } catch (error) {
    logger.error(`Error executing command ${commandName}:`, error);
    await message.reply(`Terjadi kesalahan saat menjalankan perintah ${commandName}.`);
  }
};

export default messageHandler;