import { handleOwnerCommand } from './ownerCommandHandler.js';
import { handleRegularCommand } from './regularCommandHandler.js';
import { handleNonCommandMessage } from './nonCommandHandler.js';
import { isGroupAuthorized } from '../utils/authorizedGroups.js';
import { PREFIX } from '../config/constants.js';
import logger from '../utils/logger.js';
import adventureManager from '../utils/adventureManager.js';
import { handleAdventureChoice } from '../commands/adventureCommand.js';
import groupStats from '../utils/groupStats.js';
import { isUserBanned, deleteBannedUserMessage, isOwner } from '../utils/enhancedModerationSystem.js';
import { isAdmin } from '../utils/adminChecker.js';

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

    if (isOwnerUser) {
      // Owner can always use all commands and send messages
      await handleOwnerCommand(message, groupId);
      return;
    }

    if (message.body.startsWith(PREFIX)) {
      if (isAuthorized) {
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