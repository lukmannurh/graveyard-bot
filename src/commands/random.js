const { createCanvas } = require('canvas');
const { MessageMedia } = require('whatsapp-web.js');

async function generateRandomTeams(message, args) {
    try {
        console.log("Perintah random dipanggil dengan argumen:", args);

        if (args.length < 3) {
            await message.reply('Format: .random [jumlah tim] [nama1] [nama2] ... (minimal 2 nama)');
            return;
        }

        const numTeams = parseInt(args[0]);
        if (isNaN(numTeams) || numTeams < 2) {
            await message.reply('Jumlah tim harus berupa angka dan minimal 2.');
            return;
        }

        const names = args.slice(1);
        if (names.length < numTeams) {
            await message.reply(`Masukkan setidaknya ${numTeams} nama untuk ${numTeams} tim.`);
            return;
        }

        const shuffledNames = names.sort(() => Math.random() - 0.5);
        const teams = Array.from({ length: numTeams }, () => []);
        shuffledNames.forEach((name, index) => {
            teams[index % numTeams].push(name);
        });

        // Membuat teks hasil
        let resultText = 'Hasil Pembagian Tim:\n\n';
        teams.forEach((team, index) => {
            resultText += `TIM ${index + 1}\n`;
            team.forEach((name) => {
                resultText += `• ${name}\n`;
            });
            resultText += '===============\n';
        });

        // Mengirim hasil sebagai teks
        await message.reply(resultText);
        console.log("Hasil teks berhasil dikirim");

        // Membuat gambar
        const canvasWidth = 800;
        const canvasHeight = 600;
        const canvas = createCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Judul
        ctx.fillStyle = '#333333';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Tim Acak', canvasWidth / 2, 60);

        // Elemen desain sederhana
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(50, 80);
        ctx.lineTo(canvasWidth - 50, 80);
        ctx.stroke();

        // Gambar tim
        const teamWidth = (canvasWidth - 100) / numTeams;
        const teamHeight = canvasHeight - 120;

        teams.forEach((team, teamIndex) => {
            const xPos = 50 + teamIndex * teamWidth;
            const yStart = 100;

            // Border tim
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 2;
            ctx.strokeRect(xPos, yStart, teamWidth, teamHeight);

            // Nama tim
            ctx.fillStyle = '#333333';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`TIM ${teamIndex + 1}`, xPos + teamWidth / 2, yStart + 30);

            // Garis pemisah
            ctx.strokeStyle = '#cccccc';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(xPos + 20, yStart + 50);
            ctx.lineTo(xPos + teamWidth - 20, yStart + 50);
            ctx.stroke();

            // Nama anggota tim
            ctx.font = '18px Arial';
            ctx.textAlign = 'left';
            team.forEach((name, nameIndex) => {
                ctx.fillText(`${nameIndex + 1}. ${name}`, xPos + 10, yStart + 80 + nameIndex * 30);
            });

            // Elemen desain sudut
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 2;
            const cornerSize = 10;
            // Kiri atas
            ctx.beginPath();
            ctx.moveTo(xPos, yStart + cornerSize);
            ctx.lineTo(xPos, yStart);
            ctx.lineTo(xPos + cornerSize, yStart);
            ctx.stroke();
            // Kanan atas
            ctx.beginPath();
            ctx.moveTo(xPos + teamWidth - cornerSize, yStart);
            ctx.lineTo(xPos + teamWidth, yStart);
            ctx.lineTo(xPos + teamWidth, yStart + cornerSize);
            ctx.stroke();
            // Kiri bawah
            ctx.beginPath();
            ctx.moveTo(xPos, yStart + teamHeight - cornerSize);
            ctx.lineTo(xPos, yStart + teamHeight);
            ctx.lineTo(xPos + cornerSize, yStart + teamHeight);
            ctx.stroke();
            // Kanan bawah
            ctx.beginPath();
            ctx.moveTo(xPos + teamWidth - cornerSize, yStart + teamHeight);
            ctx.lineTo(xPos + teamWidth, yStart + teamHeight);
            ctx.lineTo(xPos + teamWidth, yStart + teamHeight - cornerSize);
            ctx.stroke();
        });

        // Konversi canvas ke buffer
        const buffer = canvas.toBuffer('image/png');

        // Buat MessageMedia langsung dari buffer
        const media = new MessageMedia('image/png', buffer.toString('base64'));

        // Kirim gambar
        await message.reply(media, message.from, { caption: 'Visualisasi Tim Acak' });
        console.log("Gambar berhasil dikirim");

    } catch (error) {
        console.error("Error in generateRandomTeams:", error);
        await message.reply("Terjadi kesalahan saat membuat tim acak. Mohon coba lagi.");
    }
}

module.exports = generateRandomTeams;