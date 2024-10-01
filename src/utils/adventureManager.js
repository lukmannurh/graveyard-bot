import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AdventureManager {
  constructor() {
    this.adventures = [];
    this.activeGames = new Map();
  }

  async loadAdventures() {
    try {
      const filePath = path.join(__dirname, '../data/adventures.json');
      logger.info(`Loading adventures from ${filePath}`);
      const data = await fs.readFile(filePath, 'utf8');
      this.adventures = JSON.parse(data);
      logger.info(`Loaded ${this.adventures.length} adventures`);
      logger.debug('Adventures:', JSON.stringify(this.adventures));
    } catch (error) {
      logger.error('Error loading adventures:', error);
      throw error; // Re-throw to be caught in the calling function
    }
  }

  startAdventure(groupId, userId) {
    try {
      if (this.adventures.length === 0) {
        throw new Error("No adventures loaded");
      }
      const adventure = this.adventures[Math.floor(Math.random() * this.adventures.length)];
      this.activeGames.set(groupId, { adventure, currentNode: 'start', userId });
      return adventure.start;
    } catch (error) {
      logger.error('Error starting adventure:', error);
      return null;
    }
  }

  async getNextNode(groupId, choice) {
    try {
      const game = this.activeGames.get(groupId);
      if (!game) return null;

      const currentNode = game.adventure.nodes[game.currentNode] || game.adventure.start;
      const nextNodeId = currentNode.options.find(opt => opt.text === choice)?.next;
      if (nextNodeId) {
        game.currentNode = nextNodeId;
        return game.adventure.nodes[nextNodeId];
      }
      return null;
    } catch (error) {
      logger.error('Error getting next node:', error);
      throw error;
    }
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