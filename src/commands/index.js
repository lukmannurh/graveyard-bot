import menu from "./menu.js";
import start from "./start.js";
import tebak from "./tebak.js";
import end from "./end.js";
import list from "./list.js";
import kick from "./kick.js";
import tagall from "./tagall.js";
import ai from "./ai.js";
import authorizeGroup from "./authorizeGroup.js";
import { ban, unban } from "./moderationCommands.js";
import waifu from "./waifu.js";
import random from "./random.js";
import { bandarsabu } from "./contactCommands.js";
import { cekjomok } from "./funCommands.js";
import { adventure, handleAdventureChoice } from "./adventureCommand.js";
import getpp from "./getProfilePicture.js";
import stats from "./stats.js";
import jadwalsholat from "./jadwalsholat.js";
import stickerCommand from "./stickerCommand.js";
import downloadTikTokVideo from "./tiktokDownloader.js";
import { ytdl, ytmp4, ytmp3, spotify, fbdl, igdl } from "./downloader.js";
import animeRecommendation from "./animeRecommendation.js";
import { klasemenLiga } from "./klasemenLiga.js";
import { dadu, handleDaduGame } from "./daduGame.js";
import { startTicTacToe, makeMove } from "./ticTacToeCommands.js";
import { kingIndo } from './kingIndo.js';

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
  stickerCommand as s,
  animeRecommendation as animek,
  klasemenLiga,
  dadu,
  handleDaduGame,
  kingIndo
};

export const GENERAL_COMMANDS = [
  "menu",
  "ai",
  "start",
  "tebak",
  "list",
  "random",
  "waifu",
  "tt",
  'kingindo',
  "bandarsabu",
  "cekjomok",
  "adventure",
  "getpp",
  "stats",
  "jadwalsholat",
  "s",
  "animek",
  "ytdl",
  "ytmp4",
  "ytmp3",
  "spotify",
  "fbdl",
  "igdl",
  "klasemenliga",
  "dadu",
  "ttc",
];

export const OWNER_COMMANDS = ["authorize"];

export const ADMIN_COMMANDS = ["end", "kick", "tagall", "ban", "unban"];

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
  kingindo: kingIndo,
  waifu,
  random,
  bandarsabu,
  cekjomok,
  adventure,
  getpp,
  stats,
  jadwalsholat,
  s: stickerCommand,
  tt: downloadTikTokVideo,
  ytdl,
  ytmp4,
  ytmp3,
  spotify,
  fbdl,
  igdl,
  animek: animeRecommendation,
  klasemenliga: klasemenLiga,
  dadu,
  ttc: startTicTacToe,
};

export default exportedCommands;
