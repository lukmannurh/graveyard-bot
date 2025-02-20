import predictionManager from "../utils/predictionManager.js";
import logger from "../utils/logger.js";

const tambah = async (message, args) => {
  try {
    if (!predictionManager.isSessionActive()) {
      await message.reply("Tidak ada sesi tebak skor yang aktif saat ini.");
      return;
    }
    if (args.length !== 2) {
      await message.reply("Format tidak sesuai. Gunakan: .tambah [nama] [skor] (contoh: .tambah John 1-0)");
      return;
    }
    const [name, prediction] = args;
    const scoreRegex = /^\d+-\d+$/;
    if (!scoreRegex.test(prediction)) {
      await message.reply("Format skor tidak valid. Gunakan format angka-angka (contoh: 1-0, 2-1).");
      return;
    }
    const userId = `manual_${Date.now()}_${name}`;
    if (predictionManager.isPredictionExist(prediction)) {
      await message.reply("Skor ini sudah ditebak. Silakan pilih skor yang berbeda.");
      return;
    }
    const success = predictionManager.addPrediction(userId, prediction, Date.now(), name);
    if (success) {
      await sendPredictionList(message);
      await message.reply(`Tebakan untuk ${name} berhasil ditambahkan.`);
    } else {
      await message.reply("Terjadi kesalahan saat menambahkan prediksi. Silakan coba lagi.");
    }
  } catch (error) {
    logger.error("Error in tambah command:", error);
    await message.reply("Terjadi kesalahan saat menambahkan tebakan manual. Silakan coba lagi.");
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

export default tambah;
