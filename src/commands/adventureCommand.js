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
      const adventureList = adventureManager.getAdventureList();
      await message.reply(`Pilih petualangan yang ingin Anda jalani:\n\n${adventureList}\n\nBalas dengan nomor petualangan yang Anda pilih dalam 1 menit, atau ketik 'batal' untuk membatalkan.`);
      adventureManager.setPendingSelection(groupId, userId);
      
      logger.debug(`Set pending selection for group ${groupId}, user ${userId}`);
      
      // Set timeout for selection
      setTimeout(() => {
        if (adventureManager.getPendingSelection(groupId) === userId) {
          adventureManager.clearPendingSelection(groupId);
          message.reply('Waktu pemilihan petualangan habis. Silakan mulai ulang dengan .adventure');
        }
      }, 60000);  // 1 minute timeout
    } else {
      const activeGame = adventureManager.getActiveGame(groupId);
      logger.debug(`Active game: ${JSON.stringify(activeGame)}`);
      if (activeGame.userId !== userId) {
        logger.debug('Another user is playing');
        await message.reply('Ada petualangan yang sedang berlangsung. Tunggu hingga selesai untuk memulai yang baru.');
      } else {
        logger.debug('Current user is already playing');
        const currentNode = adventureManager.getCurrentNode(groupId);
        await sendAdventureMessage(message, currentNode, groupId);
      }
    }
  } catch (error) {
    logger.error('Error in adventure command:', error);
    await message.reply('Terjadi kesalahan saat memulai petualangan. Mohon coba lagi.');
  }
};

export const handleAdventureChoice = async (message) => {
  try {
    const chat = await message.getChat();
    const sender = await message.getContact();
    const groupId = chat.id._serialized;
    const userId = sender.id._serialized;

    logger.debug(`Handling adventure choice - Group: ${groupId}, User: ${userId}, Choice: ${message.body}`);

    const pendingUserId = adventureManager.getPendingSelection(groupId);
    logger.debug(`Pending selection for group ${groupId}: ${pendingUserId}`);

    if (pendingUserId === userId) {
      if (message.body.toLowerCase() === 'batal') {
        adventureManager.clearPendingSelection(groupId);
        await message.reply('Pemilihan petualangan dibatalkan.');
        return;
      }

      const startNode = adventureManager.selectAdventure(groupId, userId, message.body, 
        (timeoutGroupId) => handleAdventureTimeout(message, timeoutGroupId));
      
      if (startNode) {
        adventureManager.clearPendingSelection(groupId);
        await sendAdventureMessage(message, startNode, groupId);
      } else {
        await message.reply('Pilihan tidak valid. Silakan pilih nomor yang sesuai atau ketik "batal".');
      }
      return;
    }

    if (!adventureManager.isGameActive(groupId)) {
      logger.debug('No active game found');
      return;
    }

    const activeGame = adventureManager.getActiveGame(groupId);
    logger.debug(`Active game: ${JSON.stringify(activeGame)}`);

    if (activeGame.userId !== userId) {
      logger.debug('User is not the active player');
      await message.reply('Anda bukan pemain aktif dalam petualangan ini.');
      return;
    }

    const currentNode = adventureManager.getCurrentNode(groupId);
    logger.debug(`Current node: ${JSON.stringify(currentNode)}`);

    const choice = parseInt(message.body) - 1;
    
    if (isNaN(choice) || choice < 0 || choice >= (currentNode.options ? currentNode.options.length : 0)) {
      logger.debug('Invalid choice');
      await message.reply('Pilihan tidak valid. Silakan pilih nomor yang sesuai.');
      return;
    }

    const nextNodeId = currentNode.options[choice].next;
    logger.debug(`Next node ID: ${nextNodeId}`);

    const nextNode = activeGame.adventure.nodes[nextNodeId];

    if (!nextNode) {
      logger.error(`Next node not found: ${nextNodeId}`);
      await message.reply('Terjadi kesalahan. Mohon coba lagi atau mulai petualangan baru.');
      return;
    }

    logger.debug(`Updating node to: ${nextNodeId}`);
    const updateResult = adventureManager.updateCurrentNode(groupId, nextNodeId);
    logger.debug(`Update result: ${updateResult}`);

    await sendAdventureMessage(message, nextNode, groupId);
  } catch (error) {
    logger.error('Error in handling adventure choice:', error);
    await message.reply('Terjadi kesalahan saat memproses pilihan. Mohon coba lagi.');
  }
};

const sendAdventureMessage = async (message, node, groupId) => {
  try {
    logger.debug(`Sending adventure message: ${JSON.stringify(node)}`);
    const options = node.options ? node.options.map((opt, index) => `${index + 1}. ${opt.text}`).join('\n') : '';
    
    const activeGame = adventureManager.getActiveGame(groupId);
    if (!activeGame) {
      logger.error('No active game found for group');
      throw new Error('No active game found for group');
    }

    const adventureTitle = activeGame.adventure.title || 'Unknown Adventure';
    
    let replyMessage = `*${adventureTitle}*\n\n${node.text}`;
    if (options) {
      replyMessage += `\n\nPilihan:\n${options}\n\nBalas dengan nomor pilihan Anda untuk melanjutkan.\nAnda memiliki waktu 5 menit untuk menjawab.`;
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
    } else {
      adventureManager.resetTimeout(groupId, 
        (timeoutGroupId) => handleAdventureTimeout(message, timeoutGroupId));
    }
  } catch (error) {
    logger.error('Error in sendAdventureMessage:', error);
    throw error;
  }
};

export const handleAdventureTimeout = async (message, groupId) => {
  try {
    logger.debug(`Adventure timeout for group ${groupId}`);
    const chat = await message.getChat();
    await chat.sendMessage('Waktu habis! Petualangan telah berakhir karena tidak ada respon dalam 5 menit.');
    adventureManager.endGame(groupId);
  } catch (error) {
    logger.error('Error in handling adventure timeout:', error);
  }
};