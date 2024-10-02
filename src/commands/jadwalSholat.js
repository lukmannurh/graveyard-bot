import { getAllPrayerTimes } from '../utils/prayerTimes.js';

const jadwalSholatCommand = async (message, args) => {
  try {
    const prayerTimes = await getAllPrayerTimes();
    
    let response = "*Jadwal Sholat Hari Ini*\n\n";
    
    for (const [timezone, times] of Object.entries(prayerTimes)) {
      response += `*${timezone}*\n`;
      for (const [prayer, time] of Object.entries(times)) {
        response += `${prayer}: ${time}\n`;
      }
      response += '\n';
    }
    
    await message.reply(response);
  } catch (error) {
    console.error('Error in jadwalSholat command:', error);
    await message.reply('Terjadi kesalahan saat mengambil jadwal sholat. Silakan coba lagi nanti.');
  }
};

export default jadwalSholatCommand;