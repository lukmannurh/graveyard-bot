import logger from "../utils/logger.js";

const tagall = async (message) => {
  try {
    const chat = await message.getChat();

    // Dapatkan peserta grup dari beberapa fallback
    let participants = chat.participants;
    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      participants = chat.groupMetadata?.participants;
    }
    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      participants = chat._data?.groupMetadata?.participants;
    }
    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      await message.reply("Daftar anggota grup tidak tersedia. Pastikan bot sudah admin dan grup aktif.");
      return;
    }

    let text = "";
    let mentions = [];
    // Tag seluruh anggota (tanpa terkecuali)
    for (const participant of participants) {
      // Pastikan data id tersedia
      if (participant.id && participant.id.user) {
        mentions.push(participant.id._serialized || participant.id);
        text += `@${participant.id.user} `;
      }
    }

    await chat.sendMessage(text, { mentions });
  } catch (error) {
    logger.error("Error in tagall command:", error);
    await message.reply("Terjadi kesalahan saat menandai semua anggota. Mohon coba lagi.");
  }
};

export default tagall;
