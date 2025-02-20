import { checkForbiddenWord, getForbiddenWordResponse } from "../utils/wordFilter.js";
import { warnUser, isUserBanned, logViolation } from "../utils/enhancedModerationSystem.js";
import adventureManager from "../utils/adventureManager.js";
import logger from "../utils/logger.js";
import { handleAdventureChoice } from "../commands/adventureCommand.js";

export const handleNonCommandMessage = async (message, chat, sender) => {
  const groupId = chat.id._serialized;
  const userId = sender.id._serialized;
  logger.debug(`Handling non-command message in group ${groupId} from user ${userId}: ${message.body}`);

  // Jika pengguna banned, hapus pesan dan beri tahu
  if (isUserBanned(groupId, userId)) {
    logger.info(`Banned user ${sender.id.user} mencoba mengirim pesan di grup ${chat.name}`);
    await logViolation(groupId, userId, "Attempted to send message while banned");
    try {
      await message.delete(true);
      logger.info(`Pesan dari banned user ${sender.id.user} di grup ${chat.name} telah dihapus`);
    } catch (deleteError) {
      logger.error("Failed to delete message from banned user:", deleteError);
    }
    await sender.sendMessage("Anda sedang banned di grup ini. Pesan Anda telah dihapus. Ban akan berakhir dalam 1 jam.");
    return;
  }

  // Jika sedang ada game petualangan aktif, proses pilihan
  if (adventureManager.isGameActive(groupId)) {
    logger.debug(`Active adventure game ditemukan di grup ${groupId}`);
    if (/^\d+$/.test(message.body.trim())) {
      logger.debug(`Processing adventure choice: ${message.body}`);
      try {
        await handleAdventureChoice(message);
        return;
      } catch (error) {
        logger.error("Error processing adventure choice:", error);
      }
    } else {
      logger.debug(`Pesan non-numerik selama game aktif: ${message.body}`);
    }
  } else {
    logger.debug(`Tidak ada game aktif di grup ${groupId}`);
  }

  // Cek forbidden words (walaupun seharusnya sudah dicek di messageHandler, tapi untuk double-check)
  const forbiddenCheck = checkForbiddenWord(message.body, userId);
  if (forbiddenCheck.found) {
    const updatedStatus = await warnUser(groupId, userId);
    await message.reply(getForbiddenWordResponse(forbiddenCheck.word, forbiddenCheck.lowercaseWord));
    if (updatedStatus.banned) {
      await message.reply("Anda telah mencapai batas peringatan dan sekarang di-ban dari grup ini selama 1 jam.");
      await logViolation(groupId, userId, `Banned due to repeated forbidden word: ${forbiddenCheck.word}`);
    } else {
      await message.reply(`Peringatan ${updatedStatus.warnings}/5. Hati-hati dalam penggunaan kata-kata.`);
      await logViolation(groupId, userId, `Warned for forbidden word: ${forbiddenCheck.word}`);
    }
  }
};
