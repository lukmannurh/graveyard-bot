import adventureManager from '../utils/adventureManager.js';
import logger from '../utils/logger.js';

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

    const currentNode = adventureManager.getCurrentNode(groupId);
    const choice = parseInt(message.body) - 1;
    
    if (isNaN(choice) || choice < 0 || choice >= (currentNode.options ? currentNode.options.length : 0)) {
      logger.debug('Invalid choice');
      await message.reply('Pilihan tidak valid. Silakan pilih nomor yang sesuai.');
      return;
    }

    const nextNodeId = currentNode.options[choice].next;
    const nextNode = activeGame.adventure.nodes[nextNodeId];

    if (!nextNode) {
      logger.error(`Next node not found: ${nextNodeId}`);
      await message.reply('Maaf, terjadi kesalahan dalam petualangan. Petualangan akan diakhiri.');
      adventureManager.endGame(groupId);
      return;
    }

    adventureManager.updateCurrentNode(groupId, nextNodeId);
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
      replyMessage += `\n\nPilihan:\n${options}\n\nBalas dengan nomor pilihan Anda untuk melanjutkan.\nAnda memiliki waktu 1 menit untuk menjawab.`;
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
    await chat.sendMessage('Waktu habis! Petualangan telah berakhir karena tidak ada respon dalam 1 menit.');
    adventureManager.endGame(groupId);
  } catch (error) {
    logger.error('Error in handling adventure timeout:', error);
  }
};