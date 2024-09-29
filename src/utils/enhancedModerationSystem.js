// enhancedModerationSystem.js

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';
import { OWNER_NUMBER } from '../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const moderationDataFile = path.join(__dirname, '../../moderationData.json');

// In-memory cache for banned users and their ban end times
let bannedUsers = new Map();

async function loadModerationData() {
  try {
    const data = await fs.readFile(moderationDataFile, 'utf8');
    const parsedData = JSON.parse(data);
    
    // Update in-memory cache
    Object.entries(parsedData).forEach(([groupId, groupData]) => {
      Object.entries(groupData).forEach(([userId, userData]) => {
        if (userData.banned) {
          bannedUsers.set(`${groupId}:${userId}`, userData.banEndTime);
        }
      });
    });
    
    return parsedData;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {};
    }
    throw error;
  }
}

async function saveModerationData(data) {
  await fs.writeFile(moderationDataFile, JSON.stringify(data, null, 2));
  
  // Update in-memory cache
  bannedUsers.clear();
  Object.entries(data).forEach(([groupId, groupData]) => {
    Object.entries(groupData).forEach(([userId, userData]) => {
      if (userData.banned) {
        bannedUsers.set(`${groupId}:${userId}`, userData.banEndTime);
      }
    });
  });
}

export async function warnUser(groupId, userId) {
  const data = await loadModerationData();
  if (!data[groupId]) data[groupId] = {};
  if (!data[groupId][userId]) data[groupId][userId] = { warnings: 0, banned: false, banEndTime: null };

  if (userId === OWNER_NUMBER) {
    return { warnings: 0, banned: false };
  }

  data[groupId][userId].warnings++;
  
  if (data[groupId][userId].warnings >= 5) {
    return await banUser(groupId, userId);
  }

  await saveModerationData(data);
  return data[groupId][userId];
}

export async function banUser(groupId, userId) {
  if (userId === OWNER_NUMBER) {
    return { warnings: 0, banned: false };
  }

  const data = await loadModerationData();
  if (!data[groupId]) data[groupId] = {};
  
  const banEndTime = Date.now() + 3600000; // 1 hour from now
  data[groupId][userId] = { warnings: 5, banned: true, banEndTime };
  
  await saveModerationData(data);
  bannedUsers.set(`${groupId}:${userId}`, banEndTime);
  
  return data[groupId][userId];
}

export async function unbanUser(groupId, userId) {
  const data = await loadModerationData();
  if (data[groupId]?.[userId]) {
    data[groupId][userId] = { warnings: 0, banned: false, banEndTime: null };
    await saveModerationData(data);
    bannedUsers.delete(`${groupId}:${userId}`);
    return true;
  }
  return false;
}

export function isUserBanned(groupId, userId) {
  const banEndTime = bannedUsers.get(`${groupId}:${userId}`);
  if (!banEndTime) return false;
  
  if (Date.now() >= banEndTime) {
    bannedUsers.delete(`${groupId}:${userId}`);
    return false;
  }
  
  return true;
}

export async function checkUserStatus(groupId, userId) {
  const data = await loadModerationData();
  const userStatus = data[groupId]?.[userId] || { warnings: 0, banned: false, banEndTime: null };

  if (userStatus.banned && Date.now() >= userStatus.banEndTime) {
    userStatus.banned = false;
    userStatus.warnings = 0;
    userStatus.banEndTime = null;
    await saveModerationData(data);
    bannedUsers.delete(`${groupId}:${userId}`);
  }

  return userStatus;
}

export async function logViolation(groupId, userId, message) {
  const violation = {
    timestamp: new Date().toISOString(),
    groupId,
    userId,
    message
  };
  
  logger.warn(`Violation: ${JSON.stringify(violation)}`);
}

// Initialize the banned users cache
loadModerationData();