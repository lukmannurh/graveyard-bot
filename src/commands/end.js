import predictionManager from "../utils/predictionManager.js";
import logger from "../utils/logger.js";

const end = async (message) => {
  try {
    if (!predictionManager.isSessionActive()) {
      await message.reply("Tidak ada sesi tebak skor yang aktif saat ini.");
      return;
    }
    predictionManager.endMatch();
    await sendPredictionList(message);
    await message.reply("Sesi tebak skor telah ditutup.");
  } catch (error) {
    logger.error("Error in end command:", error);
    await message.reply("Terjadi kesalahan saat mengakhiri sesi tebak skor. Mohon coba lagi.");
  }
};

const sendPredictionList = async (message) => {
  try {
    const activeMatch = predictionManager.getActiveMatch();
    const predictions = predictionManager.getPredictions();
    let response = `*Daftar Tebakan Final*\n`;
    response += `Pertandingan: ${activeMatch.team1} VS ${activeMatch.team2}\n`;
    response += `Hadiah: ${activeMatch.reward}\n\n`;
    for (const prediction of predictions) {
      try {
        let name;
        if (prediction.manualName) {
          name = prediction.manualName;
        } else {
          const contact = await message.client.getContactById(prediction.userId);
          name = contact.pushname || "Unknown";
        }
        response += `${name}: ${prediction.score}\n`;
      } catch (contactError) {
        logger.error(`Error getting contact for ${prediction.userId}:`, contactError);
        response += `${prediction.manualName || "Unknown User"}: ${prediction.score}\n`;
      }
    }
    await message.reply(response);
  } catch (error) {
    logger.error("Error in sendPredictionList:", error);
    await message.reply("Terjadi kesalahan saat menampilkan daftar prediksi.");
  }
};

export default end;
