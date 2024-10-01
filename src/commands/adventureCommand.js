import adventureManager from '../utils/adventureManager.js';
import logger from '../utils/logger.js';

const adventure = async (message) => {
  try {
    const chat = await message.getChat();
    const sender = await message.getContact();
    const groupId = chat.id._serialized;
    const userId = sender.id._serialized;

    if (!adventureManager.isGameActive(groupId)) {
      const startNode = adventureManager.startAdventure(groupId, userId);
      const options = startNode.options.map((opt, index) => `${index + 1}. ${opt.text}`).join('\n');
      await message.reply(`*${adventureManager.getActiveGame(groupId).adventure.title}*\n\n${startNode.text}\n\n${options}`);
    } else {
      const activeGame = adventureManager.getActiveGame(groupId);
      if (activeGame.userId !== userId) {
        await message.reply('Ada petualangan yang sedang berlangsung. Tunggu hingga selesai untuk memulai yang baru.');
        return;
      }
      await message.reply('Petualangan sedang berlangsung. Gunakan nomor pilihan untuk melanjutkan.');
    }
  } catch (error) {
    logger.error('Error in adventure command:', error);
    await message.reply('Terjadi kesalahan saat memulai petualangan. Mohon coba lagi.');
  }
};

const handleAdventureChoice = async (message) => {
  try {
    const chat = await message.getChat();
    const sender = await message.getContact();
    const groupId = chat.id._serialized;
    const userId = sender.id._serialized;

    if (!adventureManager.isGameActive(groupId)) {
      return;
    }

    const activeGame = adventureManager.getActiveGame(groupId);
    if (activeGame.userId !== userId) {
      return;
    }

    const choice = parseInt(message.body) - 1;
    const nextNode = adventureManager.getNextNode(groupId, choice);

    if (nextNode.end) {
      await message.reply(nextNode.text);
      if (nextNode.win) {
        await message.reply('🎉 Selamat! Anda telah menyelesaikan petualangan dengan sukses!');
      } else {
        await message.reply('😔 Sayang sekali, petualangan berakhir. Coba lagi lain waktu!');
      }
      adventureManager.endGame(groupId);
    } else {
      const options = nextNode.options.map((opt, index) => `${index + 1}. ${opt.text}`).join('\n');
      await message.reply(`${nextNode.text}\n\n${options}`);
    }
  } catch (error) {
    logger.error('Error in handling adventure choice:', error);
    await message.reply('Terjadi kesalahan saat memproses pilihan. Mohon coba lagi.');
  }
};

export { adventure, handleAdventureChoice };