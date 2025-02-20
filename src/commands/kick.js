import logger from "../utils/logger.js";
import { isOwner } from "../utils/enhancedModerationSystem.js";

const kick = async (message) => {
  try {
    const chat = await message.getChat();

    // Pastikan daftar peserta grup sudah dimuat
    let participants = chat.participants;
    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      participants = await chat.fetchParticipants();
    }

    const mentioned = await message.getMentions();
    if (mentioned.length === 0) {
      await message.reply("Mohon mention pengguna yang ingin dikeluarkan.");
      return;
    }

    // Loop untuk setiap peserta yang di-mention
    for (const participant of mentioned) {
      // Jangan keluarkan jika peserta adalah owner bot
      if (isOwner(participant.id._serialized)) {
        await message.reply(`Tidak dapat mengeluarkan owner bot: @${participant.id.user}`);
        continue;
      }
      // Gunakan fungsi removeParticipant jika tersedia
      if (typeof chat.removeParticipant === "function") {
        await chat.removeParticipant(participant.id._serialized);
        logger.info(`Participant ${participant.id._serialized} dikeluarkan.`);
      } else {
        logger.warn("Fungsi removeParticipant tidak tersedia di objek chat.");
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
