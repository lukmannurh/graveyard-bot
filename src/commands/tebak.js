import predictionManager from '../utils/predictionManager.js';
import logger from '../utils/logger.js';

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

        if (predictionManager.hasUserPredicted(userId)) {
            await message.reply("Anda sudah melakukan tebakan sebelumnya. Setiap peserta hanya boleh menebak satu kali.");
            return;
        }

        if (predictionManager.isPredictionExist(prediction)) {
            await message.reply("Skor ini sudah ditebak. Silakan pilih skor yang berbeda.");
            return;
        }

        const success = predictionManager.addPrediction(userId, prediction, message.timestamp);

        if (success) {
            await sendPredictionList(message);
        } else {
            await message.reply("Terjadi kesalahan saat menambahkan prediksi Anda. Silakan coba lagi.");
        }
    } catch (error) {
        logger.error("Error in tebak command:", error);
        await message.reply("Terjadi kesalahan saat memproses tebakan Anda. Silakan coba lagi.");
    }
};

const sendPredictionList = async (message) => {
    try {
        const activeMatch = predictionManager.getActiveMatch();
        const predictions = predictionManager.getPredictions();

        let response = `*Daftar Tebakan*\n`;
        response += `Pertandingan: ${activeMatch.team1} VS ${activeMatch.team2}\n`;
        response += `Hadiah: ${activeMatch.reward}\n\n`;
        
        for (const prediction of predictions) {
            const name = prediction.manualName || (await message.client.getContactById(prediction.userId)).pushname;
            response += `${name}: ${prediction.score}\n`;
        }
        await message.reply(response);
    } catch (error) {
        logger.error("Error in sendPredictionList:", error);
        await message.reply("Terjadi kesalahan saat menampilkan daftar prediksi.");
    }
};

export default tebak;