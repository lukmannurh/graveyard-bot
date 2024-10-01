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

    logger.info(`Message received - Type: ${message.type}, From: ${userId}, Group: ${groupId}`);

    const cleanUserId = userId.replace('@c.us', '');
    const isOwner = cleanUserId === OWNER_NUMBER;

    if (isOwner) {
      await handleOwnerCommand(message, groupId);
    } else {
      const isAuthorized = await isGroupAuthorized(groupId);
      if (!isAuthorized) {
        logger.info('Unauthorized group, ignoring message');
        return;
      }

      if (message.type === 'poll_vote') {
        logger.info('Poll vote received');
        if (adventureManager.isGameActive(groupId)) {
          const activeGame = adventureManager.getActiveGame(groupId);
          if (activeGame.userId === userId) {
            const pollData = await message.getPollVote();
            logger.info(`Poll vote data: ${JSON.stringify(pollData)}`);
            if (pollData && pollData.selectedOptions && pollData.selectedOptions.length > 0) {
              const selectedOption = pollData.selectedOptions[0];
              logger.info(`Selected option: ${selectedOption}`);
              await handleAdventureChoice(message, selectedOption);
            } else {
              logger.warn('Invalid poll vote data received');
            }
          } else {
            logger.info('Poll vote from non-active player, ignoring');
          }
        } else {
          logger.info('Poll vote received but no active adventure');
        }
      } else if (message.body.startsWith(PREFIX)) {
        await handleRegularCommand(message, chat, sender);
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