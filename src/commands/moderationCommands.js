import { banUser, unbanUser } from '../utils/enhancedModerationSystem.js';
import logger from '../utils/logger.js';
import { OWNER_NUMBER } from '../config/index.js';

export const ban = async (message, args) => {
  try {
    const chat = await message.getChat();
    const mentions = await message.getMentions();

    if (mentions.length === 0) {
      await message.reply('Mohon mention pengguna yang ingin di-ban.');
      return;
    }

    const targetUser = mentions[0];
    
    if (targetUser.id.user === OWNER_NUMBER) {
      await message.reply('Tidak dapat mem-ban owner bot.');
      return;
    }

    const status = await banUser(chat.id._serialized, targetUser.id._serialized);

    if (status.banned) {
      await message.reply(`@${targetUser.id.user} telah di-ban dari grup ini selama 1 jam. Pesan mereka akan dihapus secara otomatis.`, {
        mentions: [targetUser]
      });
      await chat.sendMessage(`@${targetUser.id.user}, Anda telah di-ban dari grup ini selama 1 jam. Anda tidak dapat mengirim pesan dan pesan Anda akan dihapus secara otomatis.`, {
        mentions: [targetUser]
      });
    } else {
      await message.reply(`Gagal melakukan ban pada @${targetUser.id.user}.`, {
        mentions: [targetUser]
      });
    }
  } catch (error) {
    logger.error('Error in ban command:', error);
    await message.reply('Terjadi kesalahan saat melakukan ban.');
  }
};

export const unban = async (message, args) => {
  try {
    const chat = await message.getChat();
    const mentions = await message.getMentions();

    if (mentions.length === 0) {
      await message.reply('Mohon mention pengguna yang ingin di-unban.');
      return;
    }

    const targetUser = mentions[0];
    const success = await unbanUser(chat.id._serialized, targetUser.id._serialized);

    if (success) {
      await message.reply(`@${targetUser.id.user} telah di-unban dari grup ini.`, {
        mentions: [targetUser]
      });
      await chat.sendMessage(`@${targetUser.id.user}, Anda telah di-unban dari grup ini. Anda sekarang dapat mengirim pesan kembali. Ingat, Anda memiliki 5 kesempatan lagi sebelum ban berikutnya.`, {
        mentions: [targetUser]
      });
    } else {
      await message.reply(`@${targetUser.id.user} tidak dalam keadaan ter-ban.`, {
        mentions: [targetUser]
      });
    }
  } catch (error) {
    logger.error('Error in unban command:', error);
    await message.reply('Terjadi kesalahan saat melakukan unban.');
  }
};