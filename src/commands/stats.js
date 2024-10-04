import groupStats from '../utils/groupStats.js';
import logger from '../utils/logger.js';

const statsCommand = async (message) => {
  try {
    const chat = await message.getChat();
    if (!chat.isGroup) {
      await message.reply('Perintah ini hanya dapat digunakan dalam grup.');
      return;
    }

    const stats = groupStats.getGroupStats(chat.id._serialized);
    if (!stats) {
      await message.reply('Belum ada statistik yang tersedia untuk grup ini.');
      return;
    }

    const formatDate = (date) => {
      const options = { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric',
        weekday: 'long',
        timeZone: 'Asia/Jakarta'
      };
      return new Date(date).toLocaleDateString('id-ID', options);
    };

    const formatTime = (date) => {
      const options = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'Asia/Jakarta'
      };
      return new Date(date).toLocaleTimeString('id-ID', options);
    };

    let response = `*Statistik Grup*\n\n`;
    response += `Periode: ${formatDate(stats.startDate)} - ${formatDate(stats.endDate)}\n\n`;
    response += `Total Pesan: ${stats.totalMessages}\n\n`;
    response += `Top 10 Anggota Paling Aktif:\n`;
    
    for (let i = 0; i < Math.min(stats.topUsers.length, 10); i++) {
      const user = stats.topUsers[i];
      try {
        const contact = await message.client.getContactById(user.userId);
        const name = contact.pushname || contact.name || 'Unknown';
        response += `${i + 1}. ${name}: ${user.count} pesan\n`;
      } catch (error) {
        logger.error(`Error getting contact for ${user.userId}:`, error);
        response += `${i + 1}. Unknown User: ${user.count} pesan\n`;
      }
    }

    const now = new Date();
    response += `\nData ini diambil pada ${formatDate(now)} pada pukul ${formatTime(now)} WIB`;

    await message.reply(response);
  } catch (error) {
    logger.error('Error in stats command:', error);
    await message.reply('Terjadi kesalahan saat mengambil statistik. Mohon coba lagi nanti.');
  }
};

export default statsCommand;