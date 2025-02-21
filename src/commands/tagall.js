import logger from "../utils/logger.js";

const tagall = async (message) => {
  try {
    const chat = await message.getChat();

    // Ambil daftar peserta dengan pengecekan
    let participants = [];
    if (
      chat.participants &&
      typeof chat.participants[Symbol.iterator] === "function" &&
      chat.participants.length > 0
    ) {
      participants = chat.participants;
    } else if (
      chat.groupMetadata &&
      Array.isArray(chat.groupMetadata.participants) &&
      chat.groupMetadata.participants.length > 0
    ) {
      participants = chat.groupMetadata.participants;
    } else if (
      chat._data &&
      chat._data.groupMetadata &&
      Array.isArray(chat._data.groupMetadata.participants) &&
      chat._data.groupMetadata.participants.length > 0
    ) {
      participants = chat._data.groupMetadata.participants;
    }

    if (participants.length === 0) {
      await message.reply(
        "Daftar anggota grup tidak tersedia. Pastikan bot sudah admin dan grup aktif."
      );
      return;
    }

    let text = "";
    let mentions = [];
    for (const participant of participants) {
      // Pastikan properti id tersedia; jika berupa objek, gunakan participant.id.user
      const id =
        participant.id && participant.id.user
          ? `${participant.id.user}@c.us`
          : participant;
      // Kita tag seluruh anggota (tanpa terkecuali)
      text += `@${id.replace("@c.us", "")} `;
      mentions.push(id);
    }

    await chat.sendMessage(text, { mentions });
  } catch (error) {
    logger.error("Error in tagall command:", error);
    await message.reply(
      "Terjadi kesalahan saat menandai semua anggota. Mohon coba lagi."
    );
  }
};

export default tagall;
