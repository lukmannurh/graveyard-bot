import { handleAdventureChoice } from '../commands/adventureCommand.js';
import { handleDaduGame } from '../commands/daduGame.js';
import { handleTicTacToeResponse } from '../commands/ticTacToeCommands.js';
import { handleKlasemenResponse } from '../commands/klasemenLiga.js';
import adventureManager from '../utils/adventureManager.js';

export const handleNonCommand = async (message, isAuthorized) => {
  const groupId = message.chat.id._serialized;
  const userId = message.author || message.from;

  if (isAuthorized) {
    if (await handleAdventureResponse(message, groupId, userId)) return;
    if (await handleDaduGame(message)) return;
    if (await handleTicTacToeResponse(message)) return;
    if (await handleKlasemenResponse(message)) return;
  }
};

const handleAdventureResponse = async (message, groupId, userId) => {
  const pendingSelection = adventureManager.getPendingSelection(groupId);
  const isGameActive = adventureManager.isGameActive(groupId);
  
  if (pendingSelection === userId || (isGameActive && /^\d+$/.test(message.body.trim()))) {
    await handleAdventureChoice(message);
    return true;
  }
  return false;
};
