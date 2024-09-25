# Graveyard Bot

Bot WhatsApp cerdas dengan kemampuan AI untuk menjawab pertanyaan, menganalisis gambar, dan bermain game tebak skor.

## Fitur

- Integrasi dengan Google Generative AI (Gemini)
- Kemampuan memproses dan menganalisis gambar
- Game tebak skor untuk pertandingan sepak bola
- Perintah admin untuk manajemen grup
- Responsif terhadap pesan teks dan gambar

## Persyaratan

- Node.js (v16 atau lebih baru)
- NPM (Node Package Manager)
- Akun Google Cloud dengan akses ke Gemini API
- Whatsapp yang terhubung ke perangkat

## Instalasi

1. Clone repositori ini:
   ```
   git clone https://github.com/lukmannurh/graveyard-bot.git
   cd graveyard-cot
   ```

2. Instal dependensi:
   ```
   npm install
   ```

3. Buat file `.env` di root proyek dan tambahkan API key Google Generative AI Anda:
   ```
   API_KEY=your_google_generative_ai_api_key_here
   ```

4. Jalankan bot:
   ```
   npm start
   ```

5. Scan kode QR yang muncul dengan aplikasi WhatsApp di ponsel Anda untuk menghubungkan bot.

## Penggunaan

### Perintah Umum

- `.menu` - Menampilkan daftar perintah yang tersedia
- `.ai [pertanyaan]` - Bertanya kepada AI
- Kirim gambar dengan caption - AI akan menganalisis gambar

### Game Tebak Skor

- `.start [tim1] [tim2] [hadiah]` - Memulai sesi tebak skor
- `.tebak [skor]` - Menebak skor pertandingan (contoh: .tebak 1-0)
- `.list` - Melihat daftar tebakan peserta

### Perintah Admin

- `.end` - Mengakhiri sesi tebak skor
- `.tagall` - Menandai semua anggota grup
- `.kick @user` - Mengeluarkan anggota dari grup

## Konfigurasi

Anda dapat mengubah prefix perintah dan konfigurasi lainnya di file `src/config.js`.

## Pemecahan Masalah

Jika Anda mengalami masalah:

1. Pastikan API key Anda valid dan memiliki akses yang cukup.
2. Periksa koneksi internet Anda.
3. Pastikan Anda menggunakan versi Node.js yang didukung.
4. Lihat log error di konsol untuk informasi lebih lanjut.

## Kontribusi

Kontribusi selalu diterima! Silakan buat pull request atau buka issue jika Anda memiliki saran atau menemukan bug.

## Lisensi

[MIT License](LICENSE)