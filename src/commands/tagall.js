import logger from "../utils/logger.js";

const tagall = async (message) => {
  try {
    const chat = await message.getChat();

    // Coba dapatkan daftar peserta dengan beberapa fallback
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

    let text = "";
    let mentions = [];
    // Tag semua anggota
    for (const participant of participants) {
      // Pastikan properti id tersedia; gunakan fallback jika diperlukan
      const id = participant.id?.user ? `${participant.id.user}@c.us` : participant;
      text += `@${id.replace('@c.us','')} `;
      mentions.push(id);
    }

    await chat.sendMessage(text, { mentions });
  } catch (error) {
    logger.error("Error in tagall command:", error);
    await message.reply("Terjadi kesalahan saat menandai semua anggota. Mohon coba lagi.");
  }
};

export default tagall;
