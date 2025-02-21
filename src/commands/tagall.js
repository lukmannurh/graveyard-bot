import logger from "../utils/logger.js";

const tagall = async (message) => {
  try {
    const chat = await message.getChat();

    // Ambil daftar peserta dari chat.participants,
    // jika tidak tersedia, coba chat.groupMetadata.participants
    let participants =
      (chat.participants && Array.isArray(chat.participants) && chat.participants.length > 0)
        ? chat.participants
        : (chat.groupMetadata && chat.groupMetadata.participants) || [];

    if (!participants || participants.length === 0) {
      await message.reply("Daftar anggota grup tidak tersedia. Pastikan bot sudah admin dan grup aktif.");
      return;
    }

    let text = "";
    let mentions = [];
    // Untuk setiap peserta, format sebagai string dengan format: @<phoneNumber> 
    // (tanpa '+' dan dengan akhiran "c.us")
    for (const participant of participants) {
      // Pastikan ID tersedia. Bila participant merupakan objek Contact, bisa jadi struktur berbeda.
      const id = participant.id?.user ? `${participant.id.user}@c.us` : participant;
      text += `@${id.replace('@c.us','')} `;
      mentions.push(id);
    }

    // Kirim pesan dengan opsi 'mentions'. Dengan begitu, ketika pengguna mengetuk tag, mereka akan di-mention.
    await chat.sendMessage(text, { mentions });
  } catch (error) {
    logger.error("Error in tagall command:", error);
    await message.reply("Terjadi kesalahan saat menandai semua anggota. Mohon coba lagi.");
  }
};

export default tagall;
