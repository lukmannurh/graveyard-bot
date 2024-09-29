import { banUser, unbanUser, timeoutUser, checkUserStatus, logViolation } from '../utils/enhancedModerationSystem.js';
import logger from '../utils/logger.js';

export const ban = async (message, args) => {
  try {
    const chat = await message.getChat();
    const mentions = await message.getMentions();

    if (mentions.length === 0) {
      await message.reply('Mohon mention pengguna yang ingin di-ban.');
      return;
    }

    const targetUser = mentions[0];
    const status = await banUser(chat.id._serialized, targetUser.id._serialized);

    if (status.banned) {
      await message.reply(`@${targetUser.id.user} telah di-ban dari grup ini. Pesan mereka akan dihapus secara otomatis.`, {
        mentions: [targetUser]
      });
      await chat.sendMessage(`@${targetUser.id.user}, Anda telah di-ban dari grup ini. Anda tidak dapat mengirim pesan dan pesan Anda akan dihapus secara otomatis.`, {
        mentions: [targetUser]
      });
      await logViolation(chat.id._serialized, targetUser.id._serialized, "User banned by admin");
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
      await chat.sendMessage(`@${targetUser.id.user}, Anda telah di-unban dari grup ini. Anda sekarang dapat mengirim pesan kembali.`, {
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

export const timeout = async (message, args) => {
  try {
    const chat = await message.getChat();
    const mentions = await message.getMentions();

    if (mentions.length === 0 || args.length < 2) {
      await message.reply('Penggunaan: .timeout @user [durasi dalam menit]');
      return;
    }

    const targetUser = mentions[0];
    const duration = parseInt(args[args.length - 1]) * 60000; // Convert minutes to milliseconds

    if (isNaN(duration)) {
      await message.reply('Durasi timeout harus berupa angka (dalam menit).');
      return;
    }

    const timeoutUntil = await timeoutUser(chat.id._serialized, targetUser.id._serialized, duration);

    await message.reply(`@${targetUser.id.user} telah di-timeout sampai ${new Date(timeoutUntil).toLocaleString()}.`, {
      mentions: [targetUser]
    });
    await chat.sendMessage(`@${targetUser.id.user}, Anda telah di-timeout sampai ${new Date(timeoutUntil).toLocaleString()}.`, {
      mentions: [targetUser]
    });
    await logViolation(chat.id._serialized, targetUser.id._serialized, `User timed out for ${duration / 60000} minutes`);
  } catch (error) {
    logger.error('Error in timeout command:', error);
    await message.reply('Terjadi kesalahan saat melakukan timeout.');
  }
};