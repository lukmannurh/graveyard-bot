const menu = async (message) => {
    let menuText = "🤖 *Menu Bot Graveyard* 🤖\n\n";
    menuText += "*Perintah untuk semua pengguna:*\n";
    menuText += "• .menu - Menampilkan daftar perintah\n";
    menuText += "• .start [tim1] [tim2] [hadiah] - Memulai sesi tebak skor\n";
    menuText += "• .tebak [skor] - Menebak skor pertandingan (contoh: .tebak 1-0)\n";
    menuText += "• .list - Melihat daftar tebakan peserta\n";
    menuText += "• .ai [pertanyaan/perintah] - Bertanya atau meminta AI untuk melakukan sesuatu\n";
    menuText += "• Kirim gambar dengan caption .ai [pertanyaan/perintah] - AI akan menganalisis gambar\n";
    menuText += "\n===========================\n";
    menuText += "*Perintah khusus admin:*\n";
    menuText += "• .end - Mengakhiri sesi tebak skor\n";
    menuText += "• .tagall - Menandai semua anggota grup\n";
    menuText += "• .kick - Mengeluarkan anggota dari grup\n";
    menuText += "\n*OMKE GAS*";

    await message.reply(menuText);
};

module.exports = menu;