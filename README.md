# Graveyard Bot

Bot WhatsApp untuk permainan prediksi skor pertandingan sepak bola dalam grup.

## Fitur

- Memulai sesi tebak skor
- Menebak skor pertandingan
- Menampilkan daftar tebakan
- Mengakhiri sesi tebak skor
- Menandai semua anggota grup (hanya admin)
- Mengeluarkan anggota dari grup (hanya admin)

## Persyaratan

- Node.js (versi 14.0.0 atau lebih baru)
- npm (biasanya sudah terinstal bersama Node.js)
- Akun WhatsApp

## Instalasi

1. Clone repositori ini:
   ```
   git clone https://github.com/lukmannurh/graveyard-bot.git
   cd whatsapp-prediction-bot
   ```

2. Instal dependensi:
   ```
   npm install
   ```

3. Salin file `.env.example` menjadi `.env` dan sesuaikan jika diperlukan:
   ```
   cp .env.example .env
   ```

4. Jalankan bot:
   ```
   npm start
   ```

5. Scan kode QR yang muncul di konsol dengan aplikasi WhatsApp di ponsel Anda untuk menghubungkan bot.

## Penggunaan

Setelah bot terhubung, Anda dapat menggunakan perintah-perintah berikut di grup WhatsApp:

- `.menu` - Menampilkan daftar perintah yang tersedia
- `.start [tim1] [tim2] [hadiah]` - Memulai sesi tebak skor
- `.tebak [skor]` - Menebak skor pertandingan (contoh: .tebak 1-0)
- `.list` - Melihat daftar tebakan peserta
- `.end` - Mengakhiri sesi tebak skor (hanya admin)
- `.tagall` - Menandai semua anggota grup (hanya admin)
- `.kick @user` - Mengeluarkan anggota dari grup (hanya admin)

## Konfigurasi

Bot ini menggunakan file `.env` untuk konfigurasi. Anda dapat menyesuaikan prefix perintah dan pengaturan lainnya di `src/config.js`.

## Pengembangan

Untuk pengembangan lokal, Anda dapat menggunakan:

```
npm run dev
```

Ini akan menjalankan bot dengan nodemon, yang akan me-restart bot secara otomatis setiap kali ada perubahan pada file.

## Troubleshooting

Jika Anda mengalami masalah saat menjalankan bot:

1. Pastikan Node.js dan npm terinstal dengan benar.
2. Coba hapus folder `node_modules` dan jalankan `npm install` lagi.
3. Pastikan file `.env` dikonfigurasi dengan benar.
4. Periksa konsol untuk pesan error spesifik.

## Kontribusi

Kontribusi selalu diterima! Silakan buat issue atau pull request jika Anda memiliki saran atau perbaikan.

## Lisensi

[MIT License](LICENSE)