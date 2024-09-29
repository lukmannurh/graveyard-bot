import predictionManager from '../utils/predictionManager.js';
import logger from '../utils/logger.js';

const list = async (message) => {
    try {
        const activeMatch = predictionManager.getActiveMatch();
        const predictions = predictionManager.getPredictions();

        if (!activeMatch) {
            await message.reply("Tidak ada sesi tebak skor yang aktif saat ini.");
            return;
        }

        if (predictions.length === 0) {
            await message.reply("Belum ada tebakan yang dilakukan.");
            return;
        }

        let response = `*Daftar Tebakan*\n`;
        response += `Pertandingan: ${activeMatch.team1} VS ${activeMatch.team2}\n`;
        response += `Hadiah: ${activeMatch.reward}\n\n`;
        
        for (const prediction of predictions) {
            try {
                let name;
                if (prediction.manualName) {
                    name = prediction.manualName;
                } else {
                    const contact = await message.client.getContactById(prediction.userId);
                    name = contact.pushname || 'Unknown';
                }
                response += `${name}: ${prediction.score}\n`;
            } catch (error) {
                logger.error(`Error getting contact for ${prediction.userId}:`, error);
                response += `${prediction.manualName || 'Unknown User'}: ${prediction.score}\n`;
            }
        }
        await message.reply(response);
    } catch (error) {
        logger.error("Error in list command:", error);
        await message.reply("Terjadi kesalahan saat menampilkan daftar tebakan. Mohon coba lagi.");
    }
};

export default list;