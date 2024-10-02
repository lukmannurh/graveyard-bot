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
import { adventure } from './adventureCommand.js';
import getpp from './getProfilePicture.js';
import stats from './stats.js';
import jadwalsholat from './jadwalsholat.js';  // Pastikan nama file sesuai

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
  getpp,
  stats,
  jadwalsholat
};

export const GENERAL_COMMANDS = [
  'menu', 'ai', 'start', 'tebak', 'list', 'random', 'waifu', 
  'bandarsabu', 'cekjomok', 'adventure', 'getpp', 'stats', 'jadwalsholat'
];

export const OWNER_COMMANDS = ['authorize'];

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
  jadwalsholat
};

console.log('Exported commands:', Object.keys(exportedCommands).filter(key => key !== 'GENERAL_COMMANDS'));
console.log('Owner commands:', OWNER_COMMANDS);