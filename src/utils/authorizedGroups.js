import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authorizedGroupsFile = path.join(__dirname, '../../authorizedGroups.json');

let authorizedGroups = new Set();

async function loadAuthorizedGroups() {
  try {
    const data = await fs.readFile(authorizedGroupsFile, 'utf8');
    const groups = JSON.parse(data);
    authorizedGroups = new Set(groups);
    logger.info('Authorized groups loaded:', Array.from(authorizedGroups));
  } catch (error) {
    if (error.code === 'ENOENT') {
      authorizedGroups = new Set();
    } else {
      logger.error('Error loading authorized groups:', error);
      throw error;
    }
  }
}

async function saveAuthorizedGroups() {
  try {
    const data = JSON.stringify(Array.from(authorizedGroups), null, 2);
    await fs.writeFile(authorizedGroupsFile, data, 'utf8');
    logger.info('Authorized groups saved:', Array.from(authorizedGroups));
  } catch (error) {
    logger.error('Error saving authorized groups:', error);
    throw error;
  }
}

export function isGroupAuthorized(groupId) {
  return authorizedGroups.has(groupId);
}

export async function addAuthorizedGroup(groupId) {
  if (!authorizedGroups.has(groupId)) {
    authorizedGroups.add(groupId);
    await saveAuthorizedGroups();
    logger.info(`Group ${groupId} authorized`);
    return true;
  }
  logger.info(`Group ${groupId} already authorized`);
  return false;
}

export async function removeAuthorizedGroup(groupId) {
  if (authorizedGroups.has(groupId)) {
    authorizedGroups.delete(groupId);
    await saveAuthorizedGroups();
    logger.info(`Group ${groupId} unauthorized`);
    return true;
  }
  logger.info(`Group ${groupId} was not authorized`);
  return false;
}

// Load authorized groups when this module is imported
loadAuthorizedGroups();

export { loadAuthorizedGroups };