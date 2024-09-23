const predictionManager = require('../utils/predictionManager');

const list = async (message) => {
    const activeMatch = predictionManager.getActiveMatch();
    const predictions = predictionManager.getPredictions();

    if (!activeMatch) {
        await message.reply("Tidak ada sesi tebak skor yang aktif saat ini.");
        return;
    }

    if (Object.keys(predictions).length === 0) {
        await message.reply("Belum ada tebakan yang dilakukan.");
        return;
    }

    let response = `*Daftar Tebakan*\n`;
    response += `Pertandingan: ${activeMatch.team1} VS ${activeMatch.team2}\n`;
    response += `Hadiah: ${activeMatch.reward}\n\n`;
    
    for (const [userId, prediction] of Object.entries(predictions)) {
        const contact = await message.client.getContactById(userId);
        response += `${contact.pushname}: ${prediction}\n`;
    }
    await message.reply(response);
};

module.exports = list;