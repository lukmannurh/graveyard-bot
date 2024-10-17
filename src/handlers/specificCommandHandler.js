import downloadTikTokVideo from "../commands/tiktokDownloader.js";
import { ytdl, ytmp4, ytmp3, spotify, fbdl, igdl } from "../commands/downloader.js";
import { klasemenLiga } from "../commands/klasemenLiga.js";
import { dadu } from "../commands/daduGame.js";
import { startTicTacToe } from "../commands/ticTacToeCommands.js";
import { adventure } from "../commands/adventureCommand.js";
import logger from "../utils/logger.js";

export const handleSpecificCommands = async (message, commandName, args) => {
  switch (commandName) {
    case "tt":
      await downloadTikTokVideo(message, args);
      return true;
    case "ytdl":
      await ytdl(message, args);
      return true;
    case "ytmp4":
      await ytmp4(message, args);
      return true;
    case "ytmp3":
      await ytmp3(message, args);
      return true;
    case "spotify":
      await spotify(message, args);
      return true;
    case "fbdl":
      await fbdl(message, args);
      return true;
    case "igdl":
      await igdl(message, args);
      return true;
    case "klasemenliga":
      logger.info("Klasemen Liga command detected");
      await klasemenLiga(message, args);
      return true;
    case "dadu":
      await dadu(message, args);
      return true;
    case "ttc":
      await startTicTacToe(message, args);
      return true;
    case "adventure":
      if (isAuthorized) {
        await adventure(message, args);
        return true;
      }
      break;
  }
  return false;
};