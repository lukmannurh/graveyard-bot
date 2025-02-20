import logger from "../utils/logger.js";
import { isOwner } from "../utils/enhancedModerationSystem.js";

const kick = async (message) => {
  try {
    const chat = await message.getChat();

    // Gunakan daftar peserta dari chat.participants, 
    // atau fallback ke chat.groupMetadata.participants jika tidak tersedia
    const participants =
      chat.participants && Array.isArray(chat.participants) && chat.participants.length > 0
        ? chat.participants
        : (chat.groupMetadata && chat.groupMetadata.participants) || [];

    if (participants.length === 0) {
      await message.reply("Daftar anggota grup tidak tersedia. Pastikan bot sudah admin dan grup aktif.");
      return;
    }

    const mentioned = await message.getMentions();
    if (mentioned.length === 0) {
      await message.reply("Mohon mention pengguna yang ingin dikeluarkan.");
      return;
    }

    // Proses pengeluaran untuk setiap peserta yang di-mention
    for (const participant of mentioned) {
      // Jangan keluarkan jika target adalah owner
      if (isOwner(participant.id._serialized)) {
        await message.reply(`Tidak dapat mengeluarkan owner bot: @${participant.id.user}`);
        continue;
      }
      await chat.removeParticipants([participant.id._serialized]);
      logger.info(`Participant ${participant.id._serialized} dikeluarkan.`);
    }
    await message.reply("Pengguna yang ditandai telah dikeluarkan dari grup.");
  } catch (error) {
    logger.error("Error in kick command:", error);
    await message.reply("Terjadi kesalahan saat mengeluarkan anggota. Mohon coba lagi.");
  }
};

export default kick;
