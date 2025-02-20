import predictionManager from "../utils/predictionManager.js";
import { isAdmin } from "../utils/adminChecker.js";
import logger from "../utils/logger.js";

const start = async (message, args) => {
  try {
    if (args.length !== 3) {
      await message.reply("Format tidak sesuai. Gunakan: .start [nama tim 1] [nama tim 2] [hadiah]");
      return;
    }
    const [team1, team2, reward] = args;
    predictionManager.startMatch(team1, team2, reward);
    const announcementText = `Kuis Tebak Skor ${team1} VS ${team2}\n\nReward: ${reward}`;
    await message.reply(announcementText);
    const chat = await message.getChat();
    const sender = await message.getContact();
    if (await isAdmin(chat, sender)) {
      await tagAll(chat);
    }
  } catch (error) {
    logger.error("Error in start command:", error);
    await message.reply("Terjadi kesalahan saat memulai sesi tebak skor. Mohon coba lagi.");
  }
};

const tagAll = async (chat) => {
  try {
    let text = "";
    let mentions = [];
    for (let participant of chat.participants) {
      const contact = await chat.client.getContactById(participant.id._serialized);
      mentions.push(contact);
      text += `@${participant.id.user} `;
    }
    await chat.sendMessage(text, { mentions });
  } catch (error) {
    logger.error("Error in tagAll function:", error);
  }
};

export default start;
