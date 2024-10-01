// src/utils/adventureManager.js
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
    return adventure.start;
  }

  isGameActive(groupId) {
    const isActive = this.activeGames.has(groupId);
    logger.debug(`Checking if game is active for group ${groupId}: ${isActive}`);
    return isActive;
  }

  getActiveGame(groupId) {
    const game = this.activeGames.get(groupId);
    logger.debug(`Getting active game for group ${groupId}: ${game ? JSON.stringify(game) : 'Not found'}`);
    return game;
  }

  endGame(groupId) {
    logger.debug(`Ending game for group ${groupId}`);
    this.activeGames.delete(groupId);
  }
}

export default new AdventureManager();