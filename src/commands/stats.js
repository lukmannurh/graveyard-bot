import groupStats from '../utils/groupStats.js';

const statsCommand = async (message) => {
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
    return date.toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      weekday: 'long'
    });
  };

  let response = `*Statistik Grup*\n\n`;
  response += `Periode: ${formatDate(stats.startDate)} - ${formatDate(stats.endDate)}\n\n`;
  response += `Total Pesan: ${stats.totalMessages}\n\n`;
  response += `Top 5 Anggota Paling Aktif:\n`;
  
  for (let i = 0; i < stats.topUsers.length; i++) {
    const user = stats.topUsers[i];
    const contact = await message.client.getContactById(user.userId);
    const name = contact.pushname || contact.name || 'Unknown';
    response += `${i + 1}. ${name}: ${user.count} pesan\n`;
  }

  await message.reply(response);
};

export default statsCommand;