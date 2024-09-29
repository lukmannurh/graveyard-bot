import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authorizedGroupsFile = path.join(__dirname, '../../authorizedGroups.json');

async function loadAuthorizedGroups() {
  try {
    const data = await fs.readFile(authorizedGroupsFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function saveAuthorizedGroups(groups) {
  await fs.writeFile(authorizedGroupsFile, JSON.stringify(groups, null, 2));
}

export async function isGroupAuthorized(groupId) {
  try {
    const authorizedGroups = await loadAuthorizedGroups();
    console.log('Checking authorization for group:', groupId);
    console.log('Current authorized groups:', authorizedGroups);
    return authorizedGroups.includes(groupId);
  } catch (error) {
    logger.error('Error checking group authorization:', error);
    return false;
  }
}

export async function addAuthorizedGroup(groupId) {
  try {
    const authorizedGroups = await loadAuthorizedGroups();
    logger.debug('Current Authorized Groups:', authorizedGroups);
    if (!authorizedGroups.includes(groupId)) {
      authorizedGroups.push(groupId);
      await saveAuthorizedGroups(authorizedGroups);
      logger.info('Added new group:', groupId);
      logger.debug('Updated Authorized Groups:', authorizedGroups);
      return true;
    } else {
      logger.info('Group already authorized:', groupId);
      return false;
    }
  } catch (error) {
    logger.error('Error adding authorized group:', error);
    return false;
  }
}

export async function removeAuthorizedGroup(groupId) {
  try {
    let authorizedGroups = await loadAuthorizedGroups();
    console.log('Removing group:', groupId);
    console.log('Current authorized groups:', authorizedGroups);
    if (authorizedGroups.includes(groupId)) {
      authorizedGroups = authorizedGroups.filter(id => id !== groupId);
      await saveAuthorizedGroups(authorizedGroups);
      console.log('Updated authorized groups:', authorizedGroups);
      return true;
    } else {
      console.log('Group not found in authorized list');
      return false;
    }
  } catch (error) {
    logger.error('Error removing authorized group:', error);
    return false;
  }
}