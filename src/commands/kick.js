import logger from "../utils/logger.js";
import { isOwner } from "../utils/enhancedModerationSystem.js";

const kick = async (message) => {
  try {
    const chat = await message.getChat();

    // Coba dapatkan daftar peserta dari beberapa fallback:
    let participants = chat.participants;
    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      if (typeof chat.getParticipants === "function") {
        participants = await chat.getParticipants();
      } else if (chat.groupMetadata && Array.isArray(chat.groupMetadata.participants)) {
        participants = chat.groupMetadata.participants;
      } else if (chat._data?.groupMetadata?.participants) {
        participants = chat._data.groupMetadata.participants;
      }
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

    for (const participant of mentioned) {
      // Jangan keluarkan jika target adalah owner
      if (isOwner(participant.id._serialized)) {
        await message.reply(`Tidak dapat mengeluarkan owner bot: @${participant.id.user}`);
        continue;
      }
      // Gunakan metode removeParticipants jika ada, atau fallback ke removeParticipant
      if (typeof chat.removeParticipants === "function") {
        await chat.removeParticipants([participant.id._serialized]);
        logger.info(`Participant ${participant.id._serialized} dikeluarkan.`);
      } else if (typeof chat.removeParticipant === "function") {
        await chat.removeParticipant(participant.id._serialized);
        logger.info(`Participant ${participant.id._serialized} dikeluarkan (menggunakan removeParticipant).`);
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
