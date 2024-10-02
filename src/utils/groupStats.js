import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const statsFile = path.join(__dirname, '../../groupStats.json');

class GroupStats {
  constructor() {
    this.stats = {};
    this.startDate = null;
    this.endDate = null;
  }

  async loadStats() {
    try {
      const data = await fs.readFile(statsFile, 'utf8');
      const parsedData = JSON.parse(data);
      this.stats = parsedData.stats || {};
      this.startDate = new Date(parsedData.startDate) || new Date();
      this.endDate = new Date(parsedData.endDate) || this.calculateEndDate(this.startDate);
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.resetStats();
      } else {
        throw error;
      }
    }
    this.checkAndResetIfNeeded();
  }

  async saveStats() {
    const dataToSave = {
      stats: this.stats,
      startDate: this.startDate.toISOString(),
      endDate: this.endDate.toISOString()
    };
    await fs.writeFile(statsFile, JSON.stringify(dataToSave, null, 2));
  }

  resetStats() {
    this.stats = {};
    this.startDate = new Date();
    this.endDate = this.calculateEndDate(this.startDate);
  }

  calculateEndDate(startDate) {
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
    return endDate;
  }

  checkAndResetIfNeeded() {
    const now = new Date();
    if (now >= this.endDate) {
      this.resetStats();
    }
  }

  logMessage(groupId, userId) {
    this.checkAndResetIfNeeded();
    if (!this.stats[groupId]) {
      this.stats[groupId] = { totalMessages: 0, users: {} };
    }
    this.stats[groupId].totalMessages++;
    if (!this.stats[groupId].users[userId]) {
      this.stats[groupId].users[userId] = 0;
    }
    this.stats[groupId].users[userId]++;
  }

  getGroupStats(groupId) {
    const groupStats = this.stats[groupId];
    if (!groupStats) return null;

    const sortedUsers = Object.entries(groupStats.users)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      totalMessages: groupStats.totalMessages,
      topUsers: sortedUsers.map(([userId, count]) => ({ userId, count })),
      startDate: this.startDate,
      endDate: this.endDate
    };
  }
}

export default new GroupStats();