const predictionManager = require('../utils/predictionManager');

const tebak = async (message, args) => {
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
    const success = predictionManager.addPrediction(sender.id._serialized, prediction);

    if (success) {
        await sendPredictionList(message);
    } else {
        await message.reply("Anda sudah melakukan tebakan sebelumnya atau skor ini sudah ditebak.");
    }
};

const sendPredictionList = async (message) => {
    const activeMatch = predictionManager.getActiveMatch();
    const predictions = predictionManager.getPredictions();

    let response = `*Daftar Tebakan*\n`;
    response += `Pertandingan: ${activeMatch.team1} VS ${activeMatch.team2}\n`;
    response += `Hadiah: ${activeMatch.reward}\n\n`;
    
    for (const [userId, prediction] of Object.entries(predictions)) {
        const contact = await message.client.getContactById(userId);
        response += `${contact.pushname}: ${prediction}\n`;
    }
    await message.reply(response);
};

module.exports = tebak;