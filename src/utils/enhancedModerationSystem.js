import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const moderationDataFile = path.join(__dirname, '../../moderationData.json');

// In-memory cache for banned users
let bannedUsers = new Map();

async function loadModerationData() {
  try {
    const data = await fs.readFile(moderationDataFile, 'utf8');
    const parsedData = JSON.parse(data);
    
    // Update in-memory cache
    Object.entries(parsedData).forEach(([groupId, groupData]) => {
      Object.entries(groupData).forEach(([userId, userData]) => {
        if (userData.banned) {
          bannedUsers.set(`${groupId}:${userId}`, true);
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
        bannedUsers.set(`${groupId}:${userId}`, true);
      }
    });
  });
}

export async function warnUser(groupId, userId) {
  const data = await loadModerationData();
  if (!data[groupId]) data[groupId] = {};
  if (!data[groupId][userId]) data[groupId][userId] = { warnings: 0, banned: false, timeout: null };

  data[groupId][userId].warnings++;
  
  if (data[groupId][userId].warnings >= 3) {
    data[groupId][userId].banned = true;
    bannedUsers.set(`${groupId}:${userId}`, true);
  }

  await saveModerationData(data);
  return data[groupId][userId];
}

export async function banUser(groupId, userId) {
  const data = await loadModerationData();
  if (!data[groupId]) data[groupId] = {};
  data[groupId][userId] = { warnings: 3, banned: true, timeout: null };
  await saveModerationData(data);
  bannedUsers.set(`${groupId}:${userId}`, true);
  return data[groupId][userId];
}

export async function unbanUser(groupId, userId) {
  const data = await loadModerationData();
  if (data[groupId]?.[userId]) {
    data[groupId][userId] = { warnings: 0, banned: false, timeout: null };
    await saveModerationData(data);
    bannedUsers.delete(`${groupId}:${userId}`);
    return true;
  }
  return false;
}

export function isUserBanned(groupId, userId) {
  return bannedUsers.has(`${groupId}:${userId}`);
}

export async function timeoutUser(groupId, userId, duration) {
  const data = await loadModerationData();
  if (!data[groupId]) data[groupId] = {};
  if (!data[groupId][userId]) data[groupId][userId] = { warnings: 0, banned: false, timeout: null };

  const timeoutUntil = Date.now() + duration;
  data[groupId][userId].timeout = timeoutUntil;

  await saveModerationData(data);
  return timeoutUntil;
}

export async function checkUserStatus(groupId, userId) {
  const data = await loadModerationData();
  const userStatus = data[groupId]?.[userId] || { warnings: 0, banned: false, timeout: null };

  if (userStatus.timeout && userStatus.timeout < Date.now()) {
    userStatus.timeout = null;
    await saveModerationData(data);
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
  
  // You might want to implement more sophisticated logging here,
  // such as writing to a database or a separate log file
}

// Initialize the banned users cache
loadModerationData();