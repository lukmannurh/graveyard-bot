import logger from "../utils/logger.js";
import { PREFIX } from "../config/constants.js";

const createMenuSection = (title, commands) => {
  return `*${title}*\n${commands
    .map((cmd) => `• ${PREFIX}${cmd.name} - ${cmd.description}`)
    .join("\n")}`;
};

const menu = async (message) => {
  try {
    const menuText = `
🤖 *GRAVEYARD BOT MENU* 🤖

${createMenuSection("📱 Perintah Umum", [
  { name: "menu", description: "Menampilkan daftar perintah ini" },
  {
    name: "start [tim1] [tim2] [hadiah]",
    description: "Memulai sesi tebak skor",
  },
  {
    name: "tebak [skor]",
    description: "Menebak skor pertandingan (contoh: .tebak 1-0)",
  },
  { name: "list", description: "Melihat daftar tebakan peserta" },
  {
    name: "random [jumlah tim] [nama1] [nama2] ...",
    description: "Membuat tim acak (minimal 2 tim dan 2 nama)",
  },
  {
    name: "ai [pertanyaan/perintah]",
    description: "Bertanya atau meminta AI untuk melakukan sesuatu",
  },
  {
    name: "waifu [jumlah]",
    description: "Mendapatkan gambar waifu acak (1-10 gambar)",
  },
  {
    name: "getpp @user",
    description: "Mengambil dan mengirim foto profil pengguna yang di-tag",
  },
  {
    name: "stats",
    description: "Menampilkan statistik aktivitas grup untuk bulan ini",
  },
  {
    name: "jadwalsholat",
    description: "Menampilkan jadwal sholat untuk WIB, WITA, dan WIT",
  },
  {
    name: "s",
    description:
      "Mengubah gambar menjadi stiker (kirim gambar dengan caption .s)",
  },
  {
    name: "klasemenliga",
    description: "Menampilkan klasemen liga (Premier League, La Liga, dll.)",
  },
])}

${createMenuSection("👑 Perintah Admin", [
  { name: "end", description: "Mengakhiri sesi tebak skor" },
  { name: "tagall", description: "Menandai semua anggota grup" },
  { name: "ban @user", description: "Mem-ban pengguna dari grup" },
  { name: "unban @user", description: "Menghapus ban pengguna dari grup" },
])}

${createMenuSection("🎮 Game", [
  { name: "cekjomok", description: "Mengecek tingkat jomok Anda" },
  { name: "adventure", description: "Memulai petualangan teks interaktif" },
  {
    name: "ttc @user",
    description: "Memulai permainan Tic Tac Toe dengan pengguna yang di-tag",
  },
  { name: "dadu", description: "Bermain dadu dengan pemain lain" },
])}

${createMenuSection("🌸 Perintah Anime", [
  {
    name: "animek genres [nama_genre]",
    description: "Mendapatkan rekomendasi anime berdasarkan genre",
  },
  {
    name: "animek season [tahun] [musim]",
    description: "Melihat anime musim tertentu (spring/summer/fall/winter)",
  },
  { name: "animek top", description: "Melihat daftar top 10 anime" },
  {
    name: "animek upcoming",
    description: "Melihat daftar anime yang akan datang",
  },
  {
    name: "animek [kata_kunci]",
    description: "Mencari anime berdasarkan kata kunci",
  },
])}

${createMenuSection("📥 Downloader", [
  { name: "tt [URL]", description: "Download TikTok video" },
  { name: "ytdl [URL]", description: "Download video or audio from YouTube" },
  { name: "ytmp4 [URL]", description: "Download video from YouTube" },
  { name: "ytmp3 [URL]", description: "Download audio from YouTube" },
  { name: "spotify [URL]", description: "Download from Spotify" },
  { name: "fbdl [URL]", description: "Download video from Facebook" },
  { name: "igdl [URL]", description: "Download video from Instagram" },
])}

*Catatan:*
• Semua perintah dimulai dengan awalan ${PREFIX}
• Perintah admin hanya dapat digunakan oleh admin grup
• Untuk menggunakan AI dengan gambar, kirim gambar dengan caption yang dimulai dengan ${PREFIX}ai

🔥 *OMKE GAS* 🔥
`;

    await message.reply(menuText);
    logger.info("Menu command executed successfully");
  } catch (error) {
    logger.error("Error in menu command:", error);
    await message.reply(
      "Terjadi kesalahan saat menampilkan menu. Mohon coba lagi."
    );
  }
};

export default menu;
