import menu from './menu.js';
import start from './start.js';
import tebak from './tebak.js';
import end from './end.js';
import list from './list.js';
import kick from './kick.js';
import tagall from './tagall.js';
import ai from './ai.js';
import authorizeGroup from './authorizeGroup.js';
import { ban, unban } from './moderationCommands.js';
import waifu from './waifu.js';
import random from './random.js';
import { bandarsabu } from './contactCommands.js';
import { cekjomok } from './funCommands.js';
import { adventure, handleAdventureChoice } from './adventureCommand.js';
import getpp from './getProfilePicture.js';
import stats from './stats.js';
import jadwalsholat from './jadwalsholat.js';
import stickerCommand from './stickerCommand.js';

export {
  menu,
  start,
  tebak,
  end,
  list,
  kick,
  tagall,
  ai,
  authorizeGroup,
  ban,
  unban,
  waifu,
  random,
  bandarsabu,
  cekjomok,
  adventure,
  handleAdventureChoice,
  getpp,
  stats,
  jadwalsholat,
  stickerCommand
};

export const GENERAL_COMMANDS = [
  'menu', 'ai', 'start', 'tebak', 'list', 'random', 'waifu', 
  'bandarsabu', 'cekjomok', 'adventure', 'getpp', 'stats', 'jadwalsholat', 's'
];

export const OWNER_COMMANDS = ['authorize'];

export const ADMIN_COMMANDS = ['end', 'kick', 'tagall', 'ban', 'unban'];

const exportedCommands = {
  menu,
  start,
  tebak,
  end,
  list,
  kick,
  tagall,
  ai,
  authorizeGroup,
  ban,
  unban,
  waifu,
  random,
  bandarsabu,
  cekjomok,
  adventure,
  getpp,
  stats,
  jadwalsholat,
  stickerCommand
};

console.log('Exported commands:', Object.keys(exportedCommands).filter(key => key !== 'GENERAL_COMMANDS'));
console.log('Owner commands:', OWNER_COMMANDS);