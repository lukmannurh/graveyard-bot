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

    logger.info('Message received from:', userId);
    logger.info('OWNER_NUMBER in messageHandler:', OWNER_NUMBER);
    logger.info('Group ID:', groupId);

    const cleanUserId = userId.replace('@c.us', '');
    logger.info('Cleaned userId:', cleanUserId);
    logger.info('Is owner?', cleanUserId === OWNER_NUMBER);

    if (cleanUserId === OWNER_NUMBER) {
      logger.info('Owner detected, processing command...');
      const [command, ...args] = message.body.split(' ');
      if (command.startsWith(PREFIX)) {
        const commandName = command.slice(PREFIX.length).toLowerCase();
        logger.info('Command received:', commandName);
        if (commandName === 'authorize') {
          logger.info('Authorize command detected, args:', args);
          await commands.authorizeGroup(message, args);
        } else {
          const isAuthorized = await isGroupAuthorized(groupId);
          logger.info('Is group authorized?', isAuthorized);
          
          if (!isAuthorized) {
            logger.info('Unauthorized group, ignoring command even for owner');
            await message.reply('Grup ini tidak diotorisasi. Gunakan .authorize add untuk mengotorisasi grup.');
            return;
          }
          
          const commandFunction = commands[commandName];
          if (commandFunction) {
            logger.info(`Executing command: ${commandName}`);
            console.log(`Executing command: ${commandName}`);
            try {
              if (commandName === 'tt') {
                logger.info('TikTok downloader command detected');
                console.log('TikTok downloader command detected');
                logger.info('TikTok URL:', args[0]);
                console.log('TikTok URL:', args[0]);
                await commandFunction(message, args).catch(error => {
                  logger.error(`Error executing TikTok downloader:`, error);
                  console.error(`Error executing TikTok downloader:`, error);
                  message.reply(`Terjadi kesalahan saat menjalankan perintah ${commandName}. Mohon coba lagi nanti.`);
                });
              } else {
                await commandFunction(message, args);
              }
              logger.info(`Command ${commandName} executed successfully`);
              console.log(`Command ${commandName} executed successfully`);
            } catch (error) {
              logger.error(`Error executing command ${commandName}:`, error);
              console.error(`Error executing command ${commandName}:`, error);
              await message.reply(`Terjadi kesalahan saat menjalankan perintah ${commandName}. Mohon coba lagi nanti.`);
            }
          } else {
            logger.warn(`Unknown command: ${commandName}`);
            console.warn(`Unknown command: ${commandName}`);
            await message.reply('Perintah tidak dikenali. Gunakan .menu untuk melihat daftar perintah yang tersedia.');
          }
        }
      }
    } else {
      const isAuthorized = await isGroupAuthorized(groupId);
      logger.info('Is group authorized?', isAuthorized);
      
      if (!isAuthorized) {
        logger.info('Unauthorized group, ignoring message');
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
        logger.info(`Executing command: ${commandName}`);
        console.log(`Executing command: ${commandName}`);
        try {
          if (commandName === 'tt') {
            await commandFunction(message, args).catch(error => {
              logger.error(`Error executing TikTok downloader:`, error);
              message.reply(`Terjadi kesalahan saat menjalankan perintah ${commandName}. Mohon coba lagi nanti.`);
            });
          } else {
            await commandFunction(message, args);
          }
          logger.info(`Command ${commandName} executed successfully`);
          console.log(`Command ${commandName} executed successfully`);
        } catch (error) {
          logger.error(`Error executing command ${commandName}:`, error);
          console.error(`Error executing command ${commandName}:`, error);
          await message.reply(`Terjadi kesalahan saat menjalankan perintah ${commandName}. Mohon coba lagi nanti.`);
        }
      } else {
        logger.warn(`Unknown command: ${commandName}`);
        console.warn(`Unknown command: ${commandName}`);
        await message.reply('Perintah tidak dikenali. Gunakan .menu untuk melihat daftar perintah yang tersedia.');
      }
    }
  } catch (error) {
    logger.error('Error in messageHandler:', error);
    console.error('Error in messageHandler:', error);
    try {
      await message.reply('Terjadi kesalahan saat memproses pesan. Mohon coba lagi nanti.');
    } catch (replyError) {
      logger.error('Failed to send error message:', replyError);
      console.error('Failed to send error message:', replyError);
    }
  }
};

export default messageHandler;