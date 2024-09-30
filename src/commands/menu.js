import logger from '../utils/logger.js';

const menu = async (message) => {
    try {
        let menuText = "🤖 *Menu Bot Graveyard* 🤖\n\n";
        menuText += "*Perintah untuk semua pengguna:*\n";
        menuText += "• .menu - Menampilkan daftar perintah\n";
        menuText += "• .start [tim1] [tim2] [hadiah] - Memulai sesi tebak skor\n";
        menuText += "• .tebak [skor] - Menebak skor pertandingan (contoh: .tebak 1-0)\n";
        menuText += "• .list - Melihat daftar tebakan peserta\n";
        menuText += "• .ai [pertanyaan/perintah] - Bertanya atau meminta AI untuk melakukan sesuatu\n";
        menuText += "• Kirim gambar dengan caption .ai [pertanyaan/perintah] - AI akan menganalisis gambar\n";
        menuText += "• .random [jumlah tim] [nama1] [nama2] ... - Membuat tim acak (minimal 2 tim dan 2 nama)\n";
        menuText += "• .waifu [jumlah] - Mendapatkan gambar waifu acak (1-10 gambar)\n"; // Updated this line
        menuText += "\n===========================\n";
        menuText += "*Perintah khusus admin:*\n";
        menuText += "• .end - Mengakhiri sesi tebak skor\n";
        menuText += "• .tagall - Menandai semua anggota grup\n";
        menuText += "• .kick - Mengeluarkan anggota dari grup\n";
        menuText += "\n*OMKE GAS 🔥*";

        await message.reply(menuText);
    } catch (error) {
        logger.error("Error in menu command:", error);
        await message.reply("Terjadi kesalahan saat menampilkan menu. Mohon coba lagi.");
    }
};

export default menu;