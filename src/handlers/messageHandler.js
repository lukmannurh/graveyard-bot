import { handleOwnerCommand } from "./ownerCommandHandler.js";
import { handleRegularCommand } from "./regularCommandHandler.js";
import { handleNonCommandMessage } from "./nonCommandHandler.js";
import { isGroupAuthorized } from "../utils/authorizedGroups.js";
import { PREFIX } from "../config/constants.js";
import logger from "../utils/logger.js";
import adventureManager from "../utils/adventureManager.js";
import {
  handleAdventureChoice,
  adventure,
} from "../commands/adventureCommand.js";
import groupStats from "../utils/groupStats.js";
import {
  isUserBanned,
  deleteBannedUserMessage,
  isOwner,
} from "../utils/enhancedModerationSystem.js";
import { isAdmin } from "../utils/adminChecker.js";
import downloadTikTokVideo from "../commands/tiktokDownloader.js";
import {
  ytdl,
  ytmp4,
  ytmp3,
  spotify,
  fbdl,
  igdl,
} from "../commands/downloader.js";
import {
  klasemenLiga,
  handleKlasemenResponse,
} from "../commands/klasemenLiga.js";
import { dadu, handleDaduGame } from "../commands/daduGame.js";
import {
  checkForbiddenWord,
  getForbiddenWordResponse,
} from "../utils/wordFilter.js";
import { warnUser } from "../utils/enhancedModerationSystem.js";
import {
  startTicTacToe,
  confirmTicTacToe,
  rejectTicTacToe,
  makeMove,
} from "../commands/ticTacToeCommands.js";

const messageHandler = async (message) => {
  try {
    const chat = await message.getChat();
    if (!chat.isGroup) return;

    const sender = await message.getContact();
    const groupId = chat.id._serialized;
    const userId = sender.id._serialized;

    logger.debug(
      `Message received - Type: ${message.type}, From: ${userId}, Group: ${groupId}, Body: ${message.body}`
    );

    const isOwnerUser = isOwner(userId);
    const isGroupAdmin = await isAdmin(chat, sender);

    // Log message for stats
    if (message.fromMe === false) {
      groupStats.logMessage(groupId, userId);
    }

    const isAuthorized = isGroupAuthorized(groupId);
    logger.debug(`Group authorization status: ${isAuthorized}`);

    if (isUserBanned(groupId, userId)) {
      await deleteBannedUserMessage(message);
      await chat.sendMessage(
        `@${
          userId.split("@")[0]
        }, You are currently banned in this group. Your message has been deleted. The ban will end in 1 hour.`
      );
      return;
    }

    // Check for forbidden words
    const forbiddenCheck = checkForbiddenWord(message.body, userId);
    if (forbiddenCheck.found) {
      const updatedStatus = await warnUser(groupId, userId);
      await message.reply(
        getForbiddenWordResponse(
          forbiddenCheck.word,
          forbiddenCheck.lowercaseWord
        )
      );

      if (updatedStatus.banned) {
        await message.reply(
          "Anda telah mencapai batas peringatan dan sekarang di-ban dari grup ini selama 1 jam."
        );
      } else {
        await message.reply(
          `Peringatan ${updatedStatus.warnings}/5. Hati-hati dalam penggunaan kata-kata.`
        );
      }
      return;
    }

    if (message.body.startsWith(PREFIX)) {
      const [command, ...args] = message.body
        .slice(PREFIX.length)
        .trim()
        .split(/ +/);
      const commandName = command.toLowerCase();

      // Handle specific commands
      switch (commandName) {
        case "tt":
          await downloadTikTokVideo(message, args);
          return;
        case "ytdl":
          await ytdl(message, args);
          return;
        case "ytmp4":
          await ytmp4(message, args);
          return;
        case "ytmp3":
          await ytmp3(message, args);
          return;
        case "spotify":
          await spotify(message, args);
          return;
        case "fbdl":
          await fbdl(message, args);
          return;
        case "igdl":
          await igdl(message, args);
          return;
        case "klasemenliga":
          logger.info("Klasemen Liga command detected");
          await klasemenLiga(message, args);
          return;
        case "dadu":
          await dadu(message, args);
          return;
        case "ttc":
          await startTicTacToe(message, args);
          return;
        case "adventure":
          if (isAuthorized) {
            await adventure(message, args);
          } else {
            logger.debug(
              `Unauthorized group ${groupId}, ignoring command from non-owner`
            );
          }
          return;
      }

      if (isOwnerUser) {
        await handleOwnerCommand(message, groupId);
      } else if (isAuthorized) {
        await handleRegularCommand(message, chat, sender, isGroupAdmin);
      } else {
        logger.debug(
          `Unauthorized group ${groupId}, ignoring command from non-owner`
        );
      }
    } else {
      // Handling non-command messages
      const pendingSelection = adventureManager.getPendingSelection(groupId);
      const isGameActive = adventureManager.isGameActive(groupId);

      // Check if the message is tagging @bot for Tic Tac Toe
      const mentions = await message.getMentions();
      if (mentions.length === 1 && mentions[0].id.user === "status@broadcast") {
        await startTicTacToe(message, []);
        return;
      }

      if (
        pendingSelection === userId ||
        (isGameActive && /^\d+$/.test(message.body.trim()))
      ) {
        if (isAuthorized) {
          logger.debug(
            `Processing adventure choice: ${message.body} for group ${groupId} from user ${userId}`
          );
          await handleAdventureChoice(message);
          return;
        }
      }

      // Handle Dadu game responses
      if (await handleDaduGame(message)) {
        return;
      }

      // Handle Tic Tac Toe responses
      if (message.body.toLowerCase() === "y") {
        if (await confirmTicTacToe(message)) {
          return;
        }
      } else if (message.body.toLowerCase() === "n") {
        if (await rejectTicTacToe(message)) {
          return;
        }
      } else if (/^[1-9]$/.test(message.body)) {
        if (await makeMove(message)) {
          return;
        }
      }

      // If still not handled, proceed with other non-command handlers
      if (isAuthorized) {
        const klasemenHandled = await handleKlasemenResponse(message);
        if (!klasemenHandled) {
          await handleNonCommandMessage(message, chat, sender);
        }
      }
    }
  } catch (error) {
    logger.error("Error in messageHandler:", error);
    // Do not send error message to avoid responding to banned users
  }
};

export default messageHandler;
