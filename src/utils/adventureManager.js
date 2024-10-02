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
    this.timeouts = new Map();
  }

  async loadAdventures() {
    try {
      const filePath = path.join(__dirname, '../data/adventures.json');
      logger.debug(`Loading adventures from ${filePath}`);
      const data = await fs.readFile(filePath, 'utf8');
      this.adventures = JSON.parse(data);
      logger.debug(`Loaded ${this.adventures.length} adventures`);
    } catch (error) {
      logger.error('Error loading adventures:', error);
      throw error;
    }
  }

  startAdventure(groupId, userId) {
    logger.debug(`Starting adventure for group ${groupId} and user ${userId}`);
    if (this.adventures.length === 0) {
      logger.error("No adventures loaded");
      return null;
    }
    const adventure = this.adventures[Math.floor(Math.random() * this.adventures.length)];
    this.activeGames.set(groupId, { adventure, currentNode: 'start', userId });
    logger.debug(`Adventure started: ${adventure.title}`);
    this.startTimeout(groupId);
    return adventure.start;
  }

  isGameActive(groupId) {
    const isActive = this.activeGames.has(groupId);
    logger.debug(`Checking if game is active for group ${groupId}: ${isActive}`);
    return isActive;
  }

  getActiveGame(groupId) {
    const game = this.activeGames.get(groupId);
    if (game) {
      logger.debug(`Getting active game for group ${groupId}: Found`);
      return game;
    } else {
      logger.debug(`Getting active game for group ${groupId}: Not found`);
      return null;
    }
  }

  endGame(groupId) {
    logger.debug(`Ending game for group ${groupId}`);
    this.activeGames.delete(groupId);
    this.clearTimeout(groupId);
  }

  startTimeout(groupId) {
    this.clearTimeout(groupId);
    const timeout = setTimeout(() => {
      logger.debug(`Timeout reached for group ${groupId}`);
      this.endGame(groupId);
    }, 120000); // 2 minutes
    this.timeouts.set(groupId, timeout);
  }

  clearTimeout(groupId) {
    const existingTimeout = this.timeouts.get(groupId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      this.timeouts.delete(groupId);
    }
  }

  resetTimeout(groupId) {
    this.startTimeout(groupId);
  }
}

export default new AdventureManager();