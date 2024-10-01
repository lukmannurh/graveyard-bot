import adventureManager from '../utils/adventureManager.js';
import logger from '../utils/logger.js';
import pkg from 'whatsapp-web.js';
const { MessageMedia, Poll } = pkg;

export const adventure = async (message) => {
  try {
    logger.info('Adventure command initiated');
    const chat = await message.getChat();
    const sender = await message.getContact();
    const groupId = chat.id._serialized;
    const userId = sender.id._serialized;

    logger.info(`Group ID: ${groupId}, User ID: ${userId}`);

    if (!adventureManager.isGameActive(groupId)) {
      logger.info('Starting new adventure');
      const startNode = await adventureManager.startAdventure(groupId, userId);
      if (startNode) {
        logger.info('Adventure started successfully');
        await sendAdventureMessage(message, startNode);
      } else {
        logger.error('Failed to start adventure');
        throw new Error("Failed to start adventure");
      }
    } else {
      const activeGame = adventureManager.getActiveGame(groupId);
      if (activeGame.userId !== userId) {
        logger.info('Another adventure is in progress');
        await message.reply('Ada petualangan yang sedang berlangsung. Tunggu hingga selesai untuk memulai yang baru.');
        return;
      }
      logger.info('Adventure already in progress');
      await message.reply('Petualangan sedang berlangsung. Gunakan opsi yang tersedia untuk melanjutkan.');
    }
  } catch (error) {
    logger.error('Error in adventure command:', error);
    await message.reply('Terjadi kesalahan saat memulai petualangan. Mohon coba lagi.');
  }
};

const sendAdventureMessage = async (message, node) => {
  try {
    logger.info('Sending adventure message');
    const options = node.options.map((opt, index) => `${index + 1}. ${opt.text}`).join('\n');
    const pollOptions = node.options.map(opt => opt.text);
    
    const activeGame = adventureManager.getActiveGame(message.chat.id._serialized);
    const adventureTitle = activeGame ? activeGame.adventure.title : 'Unknown Adventure';
    
    await message.reply(`*${adventureTitle}*\n\n${node.text}`);
    logger.info('Adventure description sent');
    
    // Send poll for options
    const poll = await message.reply('Pilih tindakan selanjutnya:', {
      poll: {
        title: 'Apa yang akan Anda lakukan?',
        options: pollOptions,
        multipleAnswers: false
      }
    });
    logger.info('Poll options sent');

    // Store the poll ID for later reference
    activeGame.lastPollId = poll.id._serialized;
  } catch (error) {
    logger.error('Error in sendAdventureMessage:', error);
    throw error;
  }
};

export const handleAdventureChoice = async (message, choice) => {
  try {
    logger.info(`Handling adventure choice: ${choice}`);
    const chat = await message.getChat();
    const sender = await message.getContact();
    const groupId = chat.id._serialized;
    const userId = sender.id._serialized;

    if (!adventureManager.isGameActive(groupId)) {
      logger.info('No active game found');
      return;
    }

    const activeGame = adventureManager.getActiveGame(groupId);
    if (activeGame.userId !== userId) {
      logger.info('User is not the active player');
      return;
    }

    // Delete the previous poll if it exists
    if (activeGame.lastPollId) {
      try {
        await chat.deleteMessage(activeGame.lastPollId);
        logger.info('Previous poll deleted');
      } catch (deleteError) {
        logger.warn('Failed to delete previous poll:', deleteError);
      }
    }

    const nextNode = await adventureManager.getNextNode(groupId, choice);

    if (nextNode.end) {
      logger.info('Adventure ended');
      await message.reply(nextNode.text);
      if (nextNode.win) {
        await message.reply('🎉 Selamat! Anda telah menyelesaikan petualangan dengan sukses!');
      } else {
        await message.reply('😔 Sayang sekali, petualangan berakhir. Coba lagi lain waktu!');
      }
      adventureManager.endGame(groupId);
    } else {
      logger.info('Continuing to next node');
      await sendAdventureMessage(message, nextNode);
    }
  } catch (error) {
    logger.error('Error in handling adventure choice:', error);
    await message.reply('Terjadi kesalahan saat memproses pilihan. Mohon coba lagi.');
  }
};