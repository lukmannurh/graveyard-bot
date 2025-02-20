import logger from "../utils/logger.js";
import { isOwner } from "../utils/enhancedModerationSystem.js";

const kick = async (message) => {
  try {
    const chat = await message.getChat();
    const mentioned = await message.getMentions();

    if (mentioned.length === 0) {
      await message.reply("Mohon mention pengguna yang ingin dikeluarkan.");
      return;
    }

    // Jika fungsi removeParticipants tidak tersedia, gunakan fallback removeParticipant
    let removeFunc = chat.removeParticipants;
    if (typeof removeFunc !== "function") {
      if (typeof chat.removeParticipant === "function") {
        removeFunc = async (idArray) => {
          for (const id of idArray) {
            await chat.removeParticipant(id);
          }
        };
      } else {
        logger.warn("Fungsi removeParticipants tidak tersedia di objek chat.");
        await message.reply("Tidak dapat mengeluarkan anggota karena fungsi pengeluaran anggota tidak tersedia.");
        return;
      }
    }

    for (let participant of mentioned) {
      // Pastikan target bukan owner
      if (isOwner(participant.id._serialized)) {
        await message.reply(`Tidak dapat mengeluarkan owner bot: @${participant.id.user}`);
        continue;
      }
      await removeFunc([participant.id._serialized]);
    }

    await message.reply("Pengguna yang ditandai telah dikeluarkan dari grup.");
  } catch (error) {
    logger.error("Error in kick command:", error);
    await message.reply("Terjadi kesalahan saat mengeluarkan anggota. Mohon coba lagi.");
  }
};

export default kick;
