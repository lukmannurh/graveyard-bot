import logger from '../utils/logger.js';
import { PREFIX } from '../config/constants.js';

const createMenuSection = (title, commands) => {
  return `*${title}*\n${commands.map(cmd => `• ${PREFIX}${cmd.name} - ${cmd.description}`).join('\n')}`;
};

const menu = async (message) => {
  try {
    const generalCommands = [
      { name: 'menu', description: 'Menampilkan daftar perintah ini' },
      { name: 'ai [pertanyaan/perintah]', description: 'Bertanya atau meminta AI untuk melakukan sesuatu' },
      { name: 'start [tim1] [tim2] [hadiah]', description: 'Memulai sesi tebak skor' },
      { name: 'tebak [skor]', description: 'Menebak skor pertandingan (contoh: .tebak 1-0)' },
      { name: 'list', description: 'Melihat daftar tebakan peserta' },
      { name: 'random [jumlah tim] [nama1] [nama2] ...', description: 'Membuat tim acak (minimal 2 tim dan 2 nama)' },
      { name: 'waifu [jumlah]', description: 'Mendapatkan gambar waifu acak (1-10 gambar)' },
      { name: 'bandarsabu', description: 'Mendapatkan kontak Imam Bandar Sabu Lampung' },
      { name: 'cekjomok', description: 'Mengecek tingkat jomok Anda' },
      { name: 'adventure', description: 'Memulai petualangan teks interaktif' },
      { name: 'getpp @user', description: 'Mengambil dan mengirim foto profil pengguna yang di-tag' }
    ];

    const adminCommands = [
      { name: 'end', description: 'Mengakhiri sesi tebak skor' },
      { name: 'tagall', description: 'Menandai semua anggota grup' },
      { name: 'kick @user', description: 'Mengeluarkan anggota dari grup' },
      { name: 'ban @user', description: 'Mem-ban pengguna dari grup' },
      { name: 'unban @user', description: 'Menghapus ban pengguna dari grup' }
    ];

    const ownerCommands = [
      { name: 'authorize add/remove', description: 'Menambah atau menghapus otorisasi grup' }
    ];

    let menuText = "🤖 *Menu Bot Graveyard* 🤖\n\n";
    menuText += createMenuSection('Perintah Umum', generalCommands) + '\n\n';
    menuText += createMenuSection('Perintah Admin', adminCommands) + '\n\n';
    menuText += createMenuSection('Perintah Owner', ownerCommands) + '\n\n';
    menuText += "*Catatan Tambahan:*\n";
    menuText += "• Untuk menggunakan AI dengan gambar, kirim gambar dengan caption yang dimulai dengan .ai\n";
    menuText += "• Semua perintah dimulai dengan awalan .\n";
    menuText += "• Perintah admin hanya dapat digunakan oleh admin grup\n";
    menuText += "• Perintah owner hanya dapat digunakan oleh pemilik bot\n\n";
    menuText += "*OMKE GAS 🔥*";

    await message.reply(menuText);
    logger.info('Menu command executed successfully');
  } catch (error) {
    logger.error("Error in menu command:", error);
    await message.reply("Terjadi kesalahan saat menampilkan menu. Mohon coba lagi.");
  }
};

export default menu;