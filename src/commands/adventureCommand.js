import adventureManager from '../utils/adventureManager.js';
import logger from '../utils/logger.js';

export const adventure = async (message) => {
  try {
    const chat = await message.getChat();
    const sender = await message.getContact();
    const groupId = chat.id._serialized;
    const userId = sender.id._serialized;

    logger.debug(`Adventure command called - Group: ${groupId}, User: ${userId}`);

    const isActive = adventureManager.isGameActive(groupId);
    logger.debug(`Is game active: ${isActive}`);

    if (!isActive) {
      logger.debug('Starting new adventure');
      const startNode = await adventureManager.startAdventure(groupId, userId);
      if (startNode) {
        logger.debug('Adventure started successfully');
        await sendAdventureMessage(message, startNode, groupId);
      } else {
        logger.error('Failed to start adventure');
        throw new Error("Failed to start adventure");
      }
    } else {
      const activeGame = adventureManager.getActiveGame(groupId);
      logger.debug(`Active game: ${JSON.stringify(activeGame)}`);
      if (activeGame.userId !== userId) {
        logger.debug('Another user is playing');
        await message.reply('Ada petualangan yang sedang berlangsung. Tunggu hingga selesai untuk memulai yang baru.');
      } else {
        logger.debug('Current user is already playing');
        const currentNode = activeGame.adventure.nodes[activeGame.currentNode] || activeGame.adventure.start;
        await sendAdventureMessage(message, currentNode, groupId);
      }
    }
  } catch (error) {
    logger.error('Error in adventure command:', error);
    await message.reply('Terjadi kesalahan saat memulai petualangan. Mohon coba lagi.');
  }
};

const sendAdventureMessage = async (message, node, groupId) => {
  try {
    logger.debug(`Sending adventure message: ${JSON.stringify(node)}`);
    const options = node.options ? node.options.map((opt, index) => `${index + 1}. ${opt.text}`).join('\n') : '';
    
    if (!groupId) {
      logger.error('Group ID is undefined');
      throw new Error('Group ID is undefined');
    }

    const activeGame = adventureManager.getActiveGame(groupId);
    if (!activeGame) {
      logger.error('No active game found for group');
      throw new Error('No active game found for group');
    }

    const adventureTitle = activeGame.adventure.title || 'Unknown Adventure';
    
    let replyMessage = `*${adventureTitle}*\n\n${node.text}`;
    if (options) {
      replyMessage += `\n\nPilihan:\n${options}\n\nBalas dengan nomor pilihan Anda untuk melanjutkan.`;
    }
    
    await message.reply(replyMessage);
    logger.debug('Adventure message sent');

    if (node.end) {
      logger.debug('Adventure ended');
      if (node.win) {
        await message.reply('🎉 Selamat! Anda telah menyelesaikan petualangan dengan sukses!');
      } else {
        await message.reply('😔 Petualangan berakhir. Terima kasih telah bermain!');
      }
      adventureManager.endGame(groupId);
    }
  } catch (error) {
    logger.error('Error in sendAdventureMessage:', error);
    throw error;
  }
};

export const handleAdventureChoice = async (message) => {
  try {
    const chat = await message.getChat();
    const sender = await message.getContact();
    const groupId = chat.id._serialized;
    const userId = sender.id._serialized;

    logger.debug(`Handling adventure choice - Group: ${groupId}, User: ${userId}, Choice: ${message.body}`);

    if (!adventureManager.isGameActive(groupId)) {
      logger.debug('No active game found');
      await message.reply('Tidak ada petualangan aktif saat ini. Gunakan .adventure untuk memulai petualangan baru.');
      return;
    }

    const activeGame = adventureManager.getActiveGame(groupId);
    if (activeGame.userId !== userId) {
      logger.debug('User is not the active player');
      await message.reply('Anda bukan pemain aktif dalam petualangan ini.');
      return;
    }

    const choice = parseInt(message.body) - 1;
    const currentNode = activeGame.adventure.nodes[activeGame.currentNode] || activeGame.adventure.start;
    
    if (isNaN(choice) || choice < 0 || choice >= (currentNode.options ? currentNode.options.length : 0)) {
      logger.debug('Invalid choice');
      await message.reply('Pilihan tidak valid. Silakan pilih nomor yang sesuai.');
      return;
    }

    const nextNodeId = currentNode.options[choice].next;
    const nextNode = activeGame.adventure.nodes[nextNodeId];

    if (!nextNode) {
      logger.error(`Next node not found: ${nextNodeId}`);
      await message.reply('Terjadi kesalahan. Mohon coba lagi atau mulai petualangan baru.');
      return;
    }

    activeGame.currentNode = nextNodeId;
    await sendAdventureMessage(message, nextNode, groupId);
  } catch (error) {
    logger.error('Error in handling adventure choice:', error);
    await message.reply('Terjadi kesalahan saat memproses pilihan. Mohon coba lagi.');
  }
};