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
  try {
    const data = JSON.stringify(groups, null, 2);
    await fs.writeFile(authorizedGroupsFile, data, 'utf8');
    console.log('saveAuthorizedGroups - Successfully saved authorized groups:', groups);
  } catch (error) {
    console.error('Error saving authorized groups:', error);
    logger.error('Error saving authorized groups:', error);
    throw error;
  }
}

export async function isGroupAuthorized(groupId) {
  try {
    const authorizedGroups = await loadAuthorizedGroups();
    console.log('Checking authorization for group:', groupId);
    console.log('Current authorized groups:', authorizedGroups);
    return authorizedGroups.includes(groupId);
  } catch (error) {
    console.error('Error checking group authorization:', error);
    logger.error('Error checking group authorization:', error);
    return false;
  }
}

export async function addAuthorizedGroup(groupId) {
  try {
    const authorizedGroups = await loadAuthorizedGroups();
    console.log('addAuthorizedGroup - Current authorized groups:', authorizedGroups);
    if (!authorizedGroups.includes(groupId)) {
      authorizedGroups.push(groupId);
      await saveAuthorizedGroups(authorizedGroups);
      console.log('addAuthorizedGroup - Group added. Updated authorized groups:', authorizedGroups);
      return true;
    } else {
      console.log('addAuthorizedGroup - Group already authorized');
      return false;
    }
  } catch (error) {
    console.error('Error adding authorized group:', error);
    logger.error('Error adding authorized group:', error);
    return false;
  }
}

export async function removeAuthorizedGroup(groupId) {
  try {
    let authorizedGroups = await loadAuthorizedGroups();
    console.log('removeAuthorizedGroup - Current authorized groups:', authorizedGroups);
    console.log('removeAuthorizedGroup - Attempting to remove group:', groupId);
    
    if (authorizedGroups.includes(groupId)) {
      authorizedGroups = authorizedGroups.filter(id => id !== groupId);
      await saveAuthorizedGroups(authorizedGroups);
      console.log('removeAuthorizedGroup - Group removed. Updated authorized groups:', authorizedGroups);
      return true;
    } else {
      console.log('removeAuthorizedGroup - Group not found in authorized list');
      return false;
    }
  } catch (error) {
    console.error('Error removing authorized group:', error);
    logger.error('Error removing authorized group:', error);
    return false;
  }
}