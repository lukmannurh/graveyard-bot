import logger from "../utils/logger.js";
import { isOwner } from "../utils/enhancedModerationSystem.js";

const kick = async (message) => {
  try {
    const chat = await message.getChat();
    const mentioned = await message.getMentions();
    
    if (mentioned.length > 0) {
      for (let participant of mentioned) {
        // Cek jika peserta merupakan owner, maka jangan dikeluarkan
        if (isOwner(participant.id._serialized)) {
          await message.reply(`Tidak dapat mengeluarkan owner bot: @${participant.id.user}`);
          continue;
        }
        await chat.removeParticipants([participant.id._serialized]);
      }
      await message.reply("Pengguna yang ditandai telah dikeluarkan dari grup.");
    } else {
      await message.reply("Mention pengguna yang ingin dikeluarkan.");
    }
  } catch (error) {
    logger.error("Error in kick command:", error);
    await message.reply("Terjadi kesalahan saat mengeluarkan anggota. Mohon coba lagi.");
  }
};

export default kick;
