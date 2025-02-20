import logger from "../utils/logger.js";

const tagall = async (message) => {
  try {
    const chat = await message.getChat();
    // Gunakan properti chat.participants dan pastikan berupa array
    const participants = (chat.participants && Array.isArray(chat.participants))
      ? chat.participants
      : null;
    if (!participants || participants.length === 0) {
      await message.reply("Daftar anggota grup tidak tersedia. Pastikan bot sudah admin dan grup aktif.");
      return;
    }

    let text = "";
    let mentions = [];
    for (const participant of participants) {
      mentions.push(participant);
      text += `@${participant.id.user} `;
    }

    await chat.sendMessage(text, { mentions });
  } catch (error) {
    logger.error("Error in tagall command:", error);
    await message.reply("Terjadi kesalahan saat menandai semua anggota. Mohon coba lagi.");
  }
};

export default tagall;
