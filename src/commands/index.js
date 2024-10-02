export { default as menu } from './menu.js';
export { default as start } from './start.js';
export { default as tebak } from './tebak.js';
export { default as end } from './end.js';
export { default as list } from './list.js';
export { default as kick } from './kick.js';
export { default as tagall } from './tagall.js';
export { default as ai } from './ai.js';
export { default as authorizeGroup } from './authorizeGroup.js';
export { ban, unban } from './moderationCommands.js';
export { default as waifu } from './waifu.js';
export { default as random } from './random.js';
export { bandarsabu } from './contactCommands.js';
export { cekjomok } from './funCommands.js';
export { adventure } from './adventureCommand.js';
export { default as getpp } from './getProfilePicture.js';
export { default as stats } from './stats.js';
export { default as jadwalSholat } from './jadwalSholat.js';

export const GENERAL_COMMANDS = [
    'menu', 'ai', 'start', 'tebak', 'list', 'random', 'waifu', 
    'bandarsabu', 'cekjomok', 'adventure', 'getpp', 'stats', 'jadwalsholat'
  ];


console.log('Exported commands:', Object.keys(exports).filter(key => key !== 'GENERAL_COMMANDS'));