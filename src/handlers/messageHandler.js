// src/handlers/messageHandler.js
import { handleOwnerCommand } from './ownerCommandHandler.js';
import { handleRegularCommand } from './regularCommandHandler.js';
import { handleNonCommandMessage } from './nonCommandHandler.js';
import { isGroupAuthorized } from '../utils/authorizedGroups.js';
import { OWNER_NUMBER, PREFIX } from '../config/constants.js';
import logger from '../utils/logger.js';
import { handleAdventureChoice } from '../commands/adventureCommand.js';
import adventureManager from '../utils/adventureManager.js';

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

    if (isOwner) {
      await handleOwnerCommand(message, groupId);
    } else {
      const isAuthorized = await isGroupAuthorized(groupId);
      if (!isAuthorized) {
        logger.debug('Unauthorized group, ignoring message');
        return;
      }

      if (message.body.startsWith(PREFIX)) {
        await handleRegularCommand(message, chat, sender);
      } else if (adventureManager.isGameActive(groupId)) {
        const activeGame = adventureManager.getActiveGame(groupId);
        if (activeGame.userId === userId) {
          await handleAdventureChoice(message);
        }
      } else {
        await handleNonCommandMessage(message, chat, sender);
      }
    }
  } catch (error) {
    logger.error('Error in messageHandler:', error);
    await message.reply('Terjadi kesalahan saat memproses pesan. Mohon coba lagi nanti.');
  }
};

export default messageHandler;