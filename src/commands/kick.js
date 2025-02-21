import logger from "../utils/logger.js";
import { isOwner } from "../utils/enhancedModerationSystem.js";

const kick = async (message) => {
  try {
    const chat = await message.getChat();
    const refreshedChat = await message.client.getChatById(chat.id._serialized);

    // Coba dapatkan daftar peserta dari beberapa fallback
    let participants = refreshedChat.participants;
    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      participants = refreshedChat.groupMetadata?.participants;
    }
    if (!participants || !Array.isArray(participants) || participants.length === 0) {
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
      // Gunakan removeParticipants jika tersedia, atau fallback ke removeParticipant
      if (typeof refreshedChat.removeParticipants === "function") {
        await refreshedChat.removeParticipants([participant.id._serialized]);
        logger.info(`Participant ${participant.id._serialized} dikeluarkan.`);
      } else if (typeof refreshedChat.removeParticipant === "function") {
        await refreshedChat.removeParticipant(participant.id._serialized);
        logger.info(`Participant ${participant.id._serialized} dikeluarkan (fallback).`);
      } else {
        logger.warn("Fungsi pengeluaran anggota tidak tersedia di objek chat.");
        await message.reply("Tidak dapat mengeluarkan anggota karena fungsi pengeluaran anggota tidak tersedia.");
        return;
      }
    }
    await message.reply("Pengguna yang ditandai telah dikeluarkan dari grup.");
  } catch (error) {
    logger.error("Error in kick command:", error);
    await message.reply("Terjadi kesalahan saat mengeluarkan anggota. Mohon coba lagi.");
  }
};

export default kick;
