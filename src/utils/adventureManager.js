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
      throw error;
    }
  }

  startAdventure(groupId, userId) {
    try {
      logger.info(`Starting adventure for group ${groupId} and user ${userId}`);
      if (this.adventures.length === 0) {
        logger.error("No adventures loaded");
        throw new Error("No adventures loaded");
      }
      const adventure = this.adventures[Math.floor(Math.random() * this.adventures.length)];
      this.activeGames.set(groupId, { adventure, currentNode: 'start', userId, lastPollId: null });
      logger.info(`Adventure started: ${adventure.title}`);
      return adventure.start;
    } catch (error) {
      logger.error('Error starting adventure:', error);
      return null;
    }
  }

  async getNextNode(groupId, choice) {
    try {
      logger.info(`Getting next node for group ${groupId} with choice ${choice}`);
      const game = this.activeGames.get(groupId);
      if (!game) {
        logger.warn(`No active game found for group ${groupId}`);
        return null;
      }

      const currentNode = game.adventure.nodes[game.currentNode] || game.adventure.start;
      const nextNodeId = currentNode.options.find(opt => opt.text === choice)?.next;
      if (nextNodeId) {
        game.currentNode = nextNodeId;
        logger.info(`Moving to next node: ${nextNodeId}`);
        return game.adventure.nodes[nextNodeId];
      }
      logger.warn(`No matching option found for choice: ${choice}`);
      return null;
    } catch (error) {
      logger.error('Error getting next node:', error);
      throw error;
    }
  }

  isGameActive(groupId) {
    const isActive = this.activeGames.has(groupId);
    logger.info(`Checking if game is active for group ${groupId}: ${isActive}`);
    return isActive;
  }

  getActiveGame(groupId) {
    const game = this.activeGames.get(groupId);
    logger.info(`Getting active game for group ${groupId}: ${game ? 'Found' : 'Not found'}`);
    return game;
  }

  endGame(groupId) {
    logger.info(`Ending game for group ${groupId}`);
    this.activeGames.delete(groupId);
  }
}

export default new AdventureManager();