const predictionManager = require('../utils/predictionManager');

const tebak = async (message, args) => {
    try {
        if (!predictionManager.isSessionActive()) {
            await message.reply("Tidak ada sesi tebak skor yang aktif saat ini.");
            return;
        }

        if (args.length !== 1) {
            await message.reply("Format tidak sesuai. Gunakan: .tebak [skor] (contoh: .tebak 1-0)");
            return;
        }

        const prediction = args[0];
        const scoreRegex = /^\d+-\d+$/;
        if (!scoreRegex.test(prediction)) {
            await message.reply("Format skor tidak valid. Gunakan format angka-angka (contoh: 1-0, 2-1).");
            return;
        }

        const sender = await message.getContact();
        const userId = sender.id._serialized;

        // Periksa apakah pengguna sudah menebak sebelumnya
        if (predictionManager.hasUserPredicted(userId)) {
            await message.reply("Anda sudah melakukan tebakan sebelumnya. Setiap peserta hanya boleh menebak satu kali.");
            return;
        }

        // Periksa apakah prediksi sudah ada
        if (predictionManager.isPredictionExist(prediction)) {
            const existingPrediction = predictionManager.getPredictionByScore(prediction);
            if (existingPrediction.timestamp < message.timestamp) {
                await message.reply("Skor ini sudah ditebak oleh peserta lain yang lebih dulu. Silakan pilih skor yang berbeda.");
                return;
            } else {
                // Hapus prediksi yang ada jika timestamp lebih baru
                predictionManager.removePrediction(existingPrediction.userId);
            }
        }

        // Tambahkan prediksi baru
        const success = predictionManager.addPrediction(userId, prediction, message.timestamp);

        if (success) {
            await sendPredictionList(message);
        } else {
            await message.reply("Terjadi kesalahan saat menambahkan prediksi Anda. Silakan coba lagi.");
        }
    } catch (error) {
        console.error("Error in tebak command:", error);
        await message.reply("Terjadi kesalahan saat memproses tebakan Anda. Silakan coba lagi.");
    }
};

const sendPredictionList = async (message) => {
    const activeMatch = predictionManager.getActiveMatch();
    const predictions = predictionManager.getPredictions();

    let response = `*Daftar Tebakan*\n`;
    response += `Pertandingan: ${activeMatch.team1} VS ${activeMatch.team2}\n`;
    response += `Hadiah: ${activeMatch.reward}\n\n`;
    
    for (const prediction of predictions) {
        const contact = await message.client.getContactById(prediction.userId);
        response += `${contact.pushname}: ${prediction.score}\n`;
    }
    await message.reply(response);
};

module.exports = tebak;