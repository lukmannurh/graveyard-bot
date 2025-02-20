import { addAuthorizedGroup, removeAuthorizedGroup, isGroupAuthorized } from "../utils/authorizedGroups.js";
import { OWNER_NUMBER } from "../config/index.js";
import logger from "../utils/logger.js";

const authorizeGroup = async (message, args) => {
  try {
    const chat = await message.getChat();
    const sender = await message.getContact();
    const cleanSenderId = sender.id.user;
    const groupId = chat.id._serialized;

    logger.debug("Authorize command - Group ID:", groupId);
    logger.debug("Authorize command - Sender ID:", cleanSenderId);
    logger.debug("Authorize command - OWNER_NUMBER:", OWNER_NUMBER);

    // Gunakan fallback jika chat.isGroup tidak ada
    if (!chat.isGroup && !chat.id._serialized.endsWith("@g.us")) {
      await message.reply("Perintah ini hanya bisa digunakan di dalam grup.");
      return;
    }

    if (!OWNER_NUMBER.includes(cleanSenderId)) {
      await message.reply("Hanya pemilik bot yang dapat menggunakan perintah ini.");
      return;
    }

    if (args[0] === "remove") {
      logger.debug("Authorize command - Removing group");
      const result = await removeAuthorizedGroup(groupId);
      logger.debug("Authorize command - Remove result:", result);
      await message.reply(
        result ? "Otorisasi grup ini untuk menggunakan bot telah dicabut." : "Grup ini tidak dalam daftar grup yang diotorisasi."
      );
    } else if (args[0] === "add") {
      logger.debug("Authorize command - Adding group");
      const result = await addAuthorizedGroup(groupId);
      logger.debug("Authorize command - Add result:", result);
      await message.reply(
        result ? "Grup ini telah diotorisasi untuk menggunakan bot." : "Grup ini sudah diotorisasi sebelumnya."
      );
    } else {
      await message.reply("Penggunaan: .authorize add/remove");
    }

    const isAuthorized = isGroupAuthorized(groupId);
    logger.debug(`Authorize command - Group ${groupId} authorization status after operation: ${isAuthorized}`);
  } catch (error) {
    logger.error("Error in authorizeGroup command:", error);
    await message.reply("Terjadi kesalahan saat mengotorisasi grup. Silakan coba lagi.");
  }
};

export default authorizeGroup;
