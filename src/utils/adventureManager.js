import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AdventureManager {
  constructor() {
    this.adventures = [];
    this.activeGames = new Map();
  }

  async loadAdventures() {
    const filePath = path.join(__dirname, '../data/adventures.json');
    const data = await fs.readFile(filePath, 'utf8');
    this.adventures = JSON.parse(data);
  }

  startAdventure(groupId, userId) {
    const adventure = this.adventures[Math.floor(Math.random() * this.adventures.length)];
    this.activeGames.set(groupId, { adventure, currentNode: 'start', userId });
    return adventure.start;
  }

  getNextNode(groupId, choice) {
    const game = this.activeGames.get(groupId);
    if (!game) return null;

    const currentNode = game.adventure.nodes[game.currentNode] || game.adventure.start;
    const nextNodeId = currentNode.options[choice].next;
    game.currentNode = nextNodeId;
    return game.adventure.nodes[nextNodeId];
  }

  isGameActive(groupId) {
    return this.activeGames.has(groupId);
  }

  getActiveGame(groupId) {
    return this.activeGames.get(groupId);
  }

  endGame(groupId) {
    this.activeGames.delete(groupId);
  }
}

export default new AdventureManager();