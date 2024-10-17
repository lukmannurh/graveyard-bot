import { checkForbiddenWord, getForbiddenWordResponse } from './wordFilter.js';
import { warnUser, deleteBannedUserMessage, isUserBanned } from './enhancedModerationSystem.js';

export const checkAndHandleForbiddenWords = async (message, groupId, userId) => {
  if (isUserBanned(groupId, userId)) {
    await deleteBannedUserMessage(message);
    await message.reply(`You are currently banned in this group. Your message has been deleted.`);
    return true;
  }

  const forbiddenCheck = checkForbiddenWord(message.body, userId);
  if (forbiddenCheck.found) {
    const updatedStatus = await warnUser(groupId, userId);
    await message.reply(getForbiddenWordResponse(forbiddenCheck.word, forbiddenCheck.lowercaseWord));

    if (updatedStatus.banned) {
      await message.reply("Anda telah mencapai batas peringatan dan sekarang di-ban dari grup ini selama 1 jam.");
    } else {
      await message.reply(`Peringatan ${updatedStatus.warnings}/5. Hati-hati dalam penggunaan kata-kata.`);
    }
    return true;
  }

  return false;
};