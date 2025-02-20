import logger from "../utils/logger.js";

const tagall = async (message) => {
  try {
    const chat = await message.getChat();

    // Pastikan daftar peserta grup sudah dimuat
    let participants = chat.participants;
    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      participants = await chat.fetchParticipants();
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
