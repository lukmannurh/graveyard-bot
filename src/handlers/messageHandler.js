import { handleOwnerCommand } from './ownerCommandHandler.js';
import { handleRegularCommand } from './regularCommandHandler.js';
import { handleNonCommandMessage } from './nonCommandHandler.js';
import { isGroupAuthorized } from '../utils/authorizedGroups.js';
import { PREFIX } from '../config/constants.js';
import logger from '../utils/logger.js';
import adventureManager from '../utils/adventureManager.js';
import { handleAdventureChoice, adventure } from '../commands/adventureCommand.js';
import groupStats from '../utils/groupStats.js';
import { isUserBanned, deleteBannedUserMessage, isOwner } from '../utils/enhancedModerationSystem.js';
import { isAdmin } from '../utils/adminChecker.js';
import downloadTikTokVideo from '../commands/tiktokDownloader.js';

const messageHandler = async (message) => {
  try {
    const chat = await message.getChat();
    if (!chat.isGroup) return;

    const sender = await message.getContact();
    const groupId = chat.id._serialized;
    const userId = sender.id._serialized;

    logger.debug(`Message received - Type: ${message.type}, From: ${userId}, Group: ${groupId}, Body: ${message.body}`);

    const isOwnerUser = isOwner(userId);
    const isGroupAdmin = await isAdmin(chat, sender);

    // Log message for stats
    if (message.fromMe === false) {
      groupStats.logMessage(groupId, userId);
    }

    const isAuthorized = isGroupAuthorized(groupId);
    logger.debug(`Group authorization status: ${isAuthorized}`);

    if (isUserBanned(groupId, userId)) {
      await deleteBannedUserMessage(message);
      await chat.sendMessage(`@${userId.split('@')[0]}, Anda sedang dalam status ban di grup ini. Pesan Anda telah dihapus. Ban akan berakhir dalam 1 jam.`);
      return;
    }

    if (message.body.startsWith(PREFIX)) {
      const [command, ...args] = message.body.slice(PREFIX.length).trim().split(/ +/);
      const commandName = command.toLowerCase();

      // Tambahkan pengecekan khusus untuk perintah tt
      if (commandName === 'tt') {
        await downloadTikTokVideo(message, args);
        return;
      }

      if (commandName === 'adventure') {
        if (isAuthorized) {
          await adventure(message, args);
        } else {
          logger.debug(`Unauthorized group ${groupId}, ignoring command from non-owner`);
        }
      } else if (isOwnerUser) {
        await handleOwnerCommand(message, groupId);
      } else if (isAuthorized) {
        await handleRegularCommand(message, chat, sender, isGroupAdmin);
      } else {
        logger.debug(`Unauthorized group ${groupId}, ignoring command from non-owner`);
      }
    } else if (adventureManager.getPendingSelection(groupId) === userId || 
               (adventureManager.isGameActive(groupId) && /^\d+$/.test(message.body.trim()))) {
      if (isAuthorized) {
        logger.debug('Processing adventure choice');
        await handleAdventureChoice(message);
      }
    } else if (isAuthorized) {
      await handleNonCommandMessage(message, chat, sender);
    }
  } catch (error) {
    logger.error('Error in messageHandler:', error);
    // Do not send error message to avoid responding to banned users
  }
};

export default messageHandler;