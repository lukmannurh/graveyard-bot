import logger from "../utils/logger.js";

const tagall = async (message) => {
  try {
    const chat = await message.getChat();

    // Gunakan daftar peserta dari chat.participants, atau fallback ke chat.groupMetadata.participants
    const participants =
      chat.participants && Array.isArray(chat.participants) && chat.participants.length > 0
        ? chat.participants
        : (chat.groupMetadata && chat.groupMetadata.participants) || [];

    if (participants.length === 0) {
      await message.reply("Daftar anggota grup tidak tersedia. Pastikan bot sudah admin dan grup aktif.");
      return;
    }

    let text = "";
    let mentions = [];
    for (const participant of participants) {
      // Untuk tagall, kita tag semua anggota tanpa terkecuali
      mentions.push(participant.id._serialized);
      text += `@${participant.id.user} `;
    }

    await chat.sendMessage(text, { mentions });
  } catch (error) {
    logger.error("Error in tagall command:", error);
    await message.reply("Terjadi kesalahan saat menandai semua anggota. Mohon coba lagi.");
  }
};

export default tagall;
