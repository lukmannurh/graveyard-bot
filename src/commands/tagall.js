import logger from "../utils/logger.js";

const tagall = async (message) => {
  try {
    // Ambil chat dan "refresh" data dengan getChatById
    const chat = await message.getChat();
    const refreshedChat = await message.client.getChatById(chat.id._serialized);

    // Coba dapatkan daftar peserta dari beberapa fallback
    let participants = refreshedChat.participants;
    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      participants = refreshedChat.groupMetadata?.participants;
    }
    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      await message.reply("Daftar anggota grup tidak tersedia. Pastikan bot sudah admin dan grup aktif.");
      return;
    }

    let text = "";
    let mentions = [];
    for (const participant of participants) {
      // Format nomor: jika objek peserta memiliki property id.user, gunakan format: @<nomor>@c.us
      const id = participant.id?.user ? `${participant.id.user}@c.us` : participant;
      text += `@${id.replace("@c.us", "")} `;
      mentions.push(id);
    }

    // Kirim pesan dengan menyertakan opsi mentions agar seluruh anggota di-tag
    await refreshedChat.sendMessage(text, { mentions });
  } catch (error) {
    logger.error("Error in tagall command:", error);
    await message.reply("Terjadi kesalahan saat menandai semua anggota. Mohon coba lagi.");
  }
};

export default tagall;
