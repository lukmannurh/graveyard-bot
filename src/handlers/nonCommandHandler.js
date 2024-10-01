import { checkForbiddenWord, getForbiddenWordResponse } from '../utils/wordFilter.js';
import { warnUser, isUserBanned, checkUserStatus, logViolation } from '../utils/enhancedModerationSystem.js';
import adventureManager from '../utils/adventureManager.js';
import logger from '../utils/logger.js';

export const handleNonCommandMessage = async (message, chat, sender) => {
  const groupId = chat.id._serialized;
  const userId = sender.id._serialized;

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

  // Check for adventure choice via poll
  if (message.type === 'poll_vote' && adventureManager.isGameActive(groupId)) {
    const activeGame = adventureManager.getActiveGame(groupId);
    if (activeGame.userId === userId) {
      const pollData = await message.getPollData();
      const selectedOption = pollData.selectedOptions[0];
      await handleAdventureChoice(message, selectedOption);
    }
    return;
  }

  // Check for forbidden words
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
  }
};