import { handleOwnerCommand } from './ownerCommandHandler.js';
import { handleRegularCommand } from './regularCommandHandler.js';
import { handleNonCommandMessage } from './nonCommandHandler.js';
import { isGroupAuthorized } from '../utils/authorizedGroups.js';
import { OWNER_NUMBER, PREFIX } from '../config/constants.js';
import logger from '../utils/logger.js';
import adventureManager from '../utils/adventureManager.js';
import { handleAdventureChoice } from '../commands/adventureCommand.js';
import groupStats from '../utils/groupStats.js';
import { isUserBanned, deleteBannedUserMessage } from '../utils/enhancedModerationSystem.js';
import { isAdmin } from '../utils/adminChecker.js';

const messageHandler = async (message) => {
  try {
    const chat = await message.getChat();
    if (!chat.isGroup) return;

    const sender = await message.getContact();
    const groupId = chat.id._serialized;
    const userId = sender.id._serialized;

    logger.debug(`Message received - Type: ${message.type}, From: ${userId}, Group: ${groupId}, Body: ${message.body}`);

    const cleanUserId = userId.replace('@c.us', '');
    const isOwner = cleanUserId === OWNER_NUMBER;
    const isGroupAdmin = await isAdmin(chat, sender);

    // Check if user is banned
    if (!isOwner && isUserBanned(groupId, userId)) {
      await deleteBannedUserMessage(message);
      return;
    }

    // Log message for stats
    if (message.fromMe === false) {
      groupStats.logMessage(groupId, userId);
    }

    const isAuthorized = isGroupAuthorized(groupId);
    logger.debug(`Group authorization status: ${isAuthorized}`);

    if (message.body.startsWith(PREFIX)) {
      if (isOwner) {
        // Owner dapat menggunakan semua perintah
        await handleOwnerCommand(message, groupId);
      } else if (isAuthorized) {
        // Pengguna biasa atau admin grup dapat menggunakan perintah jika grup diotorisasi
        await handleRegularCommand(message, chat, sender, isGroupAdmin);
      } else {
        logger.debug(`Unauthorized group ${groupId}, ignoring command from non-owner`);
      }
    } else if (adventureManager.isGameActive(groupId) && /^\d+$/.test(message.body.trim())) {
      if (isAuthorized || isOwner) {
        logger.debug('Processing adventure choice');
        await handleAdventureChoice(message);
      }
    } else if (isAuthorized || isOwner) {
      await handleNonCommandMessage(message, chat, sender);
    }
  } catch (error) {
    logger.error('Error in messageHandler:', error);
    // Do not send error message to avoid responding to banned users
  }
};

export default messageHandler;