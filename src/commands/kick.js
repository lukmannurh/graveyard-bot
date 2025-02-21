import logger from "../utils/logger.js";
import { isOwner } from "../utils/enhancedModerationSystem.js";

const kick = async (message) => {
  try {
    const chat = await message.getChat();

    // Ambil daftar peserta dari chat.participants atau chat.groupMetadata.participants
    let participants =
      (chat.participants && Array.isArray(chat.participants) && chat.participants.length > 0)
        ? chat.participants
        : (chat.groupMetadata && chat.groupMetadata.participants) || [];

    if (!participants || participants.length === 0) {
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
      // Gunakan metode removeParticipants (kode lama) jika tersedia
      if (typeof chat.removeParticipants === "function") {
        await chat.removeParticipants([participant.id._serialized]);
        logger.info(`Participant ${participant.id._serialized} dikeluarkan.`);
      } else if (typeof chat.removeParticipant === "function") {
        // Fallback jika hanya ada removeParticipant
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
