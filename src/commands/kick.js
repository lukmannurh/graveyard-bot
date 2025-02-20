import logger from "../utils/logger.js";

const kick = async (message) => {
  try {
    const chat = await message.getChat();

    // Pastikan chat mendukung fungsi removeParticipants
    if (typeof chat.removeParticipants !== "function") {
      logger.warn("Fungsi removeParticipants tidak tersedia di objek chat.");
      await message.reply("Tidak dapat mengeluarkan anggota karena fungsi pengeluaran anggota tidak tersedia.");
      return;
    }

    const mentionedIds = await message.getMentions();
    if (mentionedIds.length === 0) {
      await message.reply("Mohon mention pengguna yang ingin dikeluarkan.");
      return;
    }

    // Proses pengeluaran setiap peserta yang di-mention
    for (let participant of mentionedIds) {
      await chat.removeParticipants([participant.id._serialized]);
    }
    await message.reply("Pengguna yang ditandai telah dikeluarkan dari grup.");
  } catch (error) {
    logger.error("Error in kick command:", error);
    await message.reply("Terjadi kesalahan saat mengeluarkan anggota. Mohon coba lagi.");
  }
};

export default kick;
