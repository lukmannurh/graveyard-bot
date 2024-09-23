const predictionManager = require('../utils/predictionManager');

const end = async (message) => {
    predictionManager.endMatch();
    await sendPredictionList(message);
    await message.reply("Sesi tebak skor telah ditutup.");
};

const sendPredictionList = async (message) => {
    const activeMatch = predictionManager.getActiveMatch();
    const predictions = predictionManager.getPredictions();

    let response = `*Daftar Tebakan Final*\n`;
    response += `Pertandingan: ${activeMatch.team1} VS ${activeMatch.team2}\n`;
    response += `Hadiah: ${activeMatch.reward}\n\n`;
    
    for (const [userId, prediction] of Object.entries(predictions)) {
        const contact = await message.client.getContactById(userId);
        response += `${contact.pushname}: ${prediction}\n`;
    }
    await message.reply(response);
};

module.exports = end;