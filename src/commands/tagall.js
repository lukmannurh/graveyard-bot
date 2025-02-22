import logger from "../utils/logger.js";

const tagall = async (message) => {
  try {
    const chat = await message.getChat();
    let participants = [];

    // Coba ambil peserta dari berbagai sumber
    if (typeof chat.fetchParticipants === "function") {
      participants = await chat.fetchParticipants();
    } else if (chat.groupMetadata && Array.isArray(chat.groupMetadata.participants)) {
      participants = chat.groupMetadata.participants;
    } else if (chat.participants && Array.isArray(chat.participants)) {
      participants = chat.participants;
    } else if (chat._data && chat._data.groupMetadata && Array.isArray(chat._data.groupMetadata.participants)) {
      participants = chat._data.groupMetadata.participants;
    } else {
      throw new Error("Daftar peserta tidak tersedia");
    }

    if (participants.length === 0) {
      await message.reply("Daftar anggota grup tidak tersedia. Pastikan bot sudah admin dan grup aktif.");
      return;
    }

    let text = "";
    let mentions = [];
    for (let participant of participants) {
      let id;
      // Jika peserta berupa objek dengan properti id.user
      if (participant.id && participant.id.user) {
        id = participant.id._serialized;
        text += `@${participant.id.user} `;
      } else if (typeof participant === "string") {
        // Jika peserta berupa string ID
        id = participant;
        text += `@${participant.replace("@c.us", "")} `;
      }
      if (id) mentions.push(id);
    }

    await chat.sendMessage(text, { mentions });
  } catch (error) {
    logger.error("Error in tagall command:", error);
    await message.reply("Terjadi kesalahan saat menandai semua anggota. Mohon coba lagi.");
  }
};

export default tagall;
