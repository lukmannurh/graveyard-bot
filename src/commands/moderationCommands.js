import { banUser, unbanUser } from '../utils/enhancedModerationSystem.js';
import logger from '../utils/logger.js';
import { OWNER_NUMBER } from '../config/index.js';
import { isAdmin } from '../utils/adminChecker.js';

export const ban = async (message, args) => {
  try {
    const chat = await message.getChat();
    const sender = await message.getContact();
    const mentions = await message.getMentions();

    if (!isAdmin(chat, sender) && sender.id.user !== OWNER_NUMBER) {
      await message.reply('Anda tidak memiliki izin untuk menggunakan perintah ini.');
      return;
    }

    if (mentions.length === 0) {
      await chat.sendMessage('Mohon mention pengguna yang ingin di-ban.');
      return;
    }

    const targetUser = mentions[0];
    
    if (targetUser.id.user === OWNER_NUMBER) {
      await chat.sendMessage('Tidak dapat mem-ban owner bot.');
      return;
    }

    const status = await banUser(chat.id._serialized, targetUser.id._serialized);

    if (status.banned) {
      await chat.sendMessage(`@${targetUser.id.user} telah di-ban dari grup ini selama 1 jam. Pesan mereka akan dihapus secara otomatis.`, {
        mentions: [targetUser]
      });
    } else {
      await chat.sendMessage(`Gagal melakukan ban pada @${targetUser.id.user}.`, {
        mentions: [targetUser]
      });
    }
  } catch (error) {
    logger.error('Error in ban command:', error);
    await message.chat.sendMessage('Terjadi kesalahan saat melakukan ban.');
  }
};

export const unban = async (message, args) => {
  try {
    const chat = await message.getChat();
    const sender = await message.getContact();
    const mentions = await message.getMentions();

    if (!isAdmin(chat, sender) && sender.id.user !== OWNER_NUMBER) {
      await message.reply('Anda tidak memiliki izin untuk menggunakan perintah ini.');
      return;
    }

    if (mentions.length === 0) {
      await chat.sendMessage('Mohon mention pengguna yang ingin di-unban.');
      return;
    }

    const targetUser = mentions[0];
    const success = await unbanUser(chat.id._serialized, targetUser.id._serialized);

    if (success) {
      await chat.sendMessage(`@${targetUser.id.user} telah di-unban dari grup ini.`, {
        mentions: [targetUser]
      });
    } else {
      await chat.sendMessage(`@${targetUser.id.user} tidak dalam keadaan ter-ban.`, {
        mentions: [targetUser]
      });
    }
  } catch (error) {
    logger.error('Error in unban command:', error);
    await message.chat.sendMessage('Terjadi kesalahan saat melakukan unban.');
  }
};