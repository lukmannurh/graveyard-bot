import { handleOwnerCommand } from "./ownerCommandHandler.js";
import { handleRegularCommand } from "./regularCommandHandler.js";
import { handleNonCommandMessage } from "./nonCommandHandler.js";
import { isGroupAuthorized } from "../utils/authorizedGroups.js";
import { PREFIX } from "../config/constants.js";
import logger from "../utils/logger.js";
import adventureManager from "../utils/adventureManager.js";
import { handleAdventureChoice, adventure } from "../commands/adventureCommand.js";
import groupStats from "../utils/groupStats.js";
import { isUserBanned, deleteBannedUserMessage, isOwner } from "../utils/enhancedModerationSystem.js";
import { isAdmin } from "../utils/adminChecker.js";
import downloadTikTokVideo from "../commands/tiktokDownloader.js";
import { ytdl, ytmp4, ytmp3, spotify, fbdl, igdl } from "../commands/downloader.js";
import { klasemenLiga, handleKlasemenResponse } from "../commands/klasemenLiga.js";
import { dadu, handleDaduGame } from "../commands/daduGame.js";
import { checkForbiddenWord, getForbiddenWordResponse } from "../utils/wordFilter.js";
import { warnUser } from "../utils/enhancedModerationSystem.js";
import { startTicTacToe, handleTicTacToeResponse } from "../commands/ticTacToeCommands.js";

const messageHandler = async (message) => {
  try {
    const chat = await message.getChat();
    // Hanya proses pesan jika berasal dari grup (untuk pengujian, Anda dapat menonaktifkan pengecekan ini)
    if (!chat.isGroup) {
      logger.debug("Pesan bukan dari grup, diabaikan.");
      return;
    }

    const sender = await message.getContact();
    const groupId = chat.id._serialized;
    const userId = sender.id._serialized;
    logger.info(`Message received in group ${groupId} from ${userId}: ${message.body}`);

    // Update statistik grup
    if (!message.fromMe) {
      groupStats.logMessage(groupId, userId);
    }

    const isAuthorized = isGroupAuthorized(groupId);
    logger.debug(`Group authorization status for ${groupId}: ${isAuthorized}`);

    // Cek status banned
    if (isUserBanned(groupId, userId)) {
      await deleteBannedUserMessage(message);
      await chat.sendMessage(
        `@${userId.split("@")[0]}, Anda sedang banned. Pesan Anda telah dihapus. Ban akan berakhir dalam 1 jam.`
      );
      return;
    }

    // Cek kata-kata terlarang
    const forbiddenCheck = checkForbiddenWord(message.body, userId);
    if (forbiddenCheck.found) {
      const updatedStatus = await warnUser(groupId, userId);
      await message.reply(getForbiddenWordResponse(forbiddenCheck.word, forbiddenCheck.lowercaseWord));
      if (updatedStatus.banned) {
        await message.reply("Anda telah mencapai batas peringatan dan sekarang di-ban dari grup ini selama 1 jam.");
      } else {
        await message.reply(`Peringatan ${updatedStatus.warnings}/5. Hati-hati dalam penggunaan kata-kata.`);
      }
      return;
    }

    // Jika pesan dimulai dengan prefix, anggap sebagai perintah
    if (message.body.startsWith(PREFIX)) {
      const [command, ...args] = message.body.slice(PREFIX.length).trim().split(/ +/);
      const commandName = command.toLowerCase();
      logger.info(`Command received: ${commandName} with args: ${args.join(" ")}`);

      // Tangani perintah khusus yang tidak masuk ke handler umum
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
            logger.debug(`Group ${groupId} tidak diotorisasi, perintah adventure diabaikan.`);
          }
          return;
      }

      // Jika pengirim adalah owner, gunakan handler owner
      const isOwnerUser = isOwner(userId);
      const isGroupAdmin = await isAdmin(chat, sender);
      if (isOwnerUser) {
        await handleOwnerCommand(message, groupId);
      } else if (isAuthorized) {
        await handleRegularCommand(message, chat, sender, isGroupAdmin);
      } else {
        logger.debug(`Group ${groupId} tidak diotorisasi, perintah dari ${userId} diabaikan.`);
      }
    } else {
      // Penanganan pesan non-perintah
      const pendingSelection = adventureManager.getPendingSelection(groupId);
      const isGameActive = adventureManager.isGameActive(groupId);

      // Cek jika pesan mengandung tag untuk memulai Tic Tac Toe (misalnya tag @bot)
      const mentions = await message.getMentions();
      if (mentions.length === 1 && mentions[0].id.user === "status@broadcast") {
        await startTicTacToe(message, []);
        return;
      }

      // Jika pesan berupa angka dan berkaitan dengan pilihan petualangan
      if (pendingSelection === userId || (isGameActive && /^\d+$/.test(message.body.trim()))) {
        if (isAuthorized) {
          logger.debug(`Processing adventure choice: ${message.body} for group ${groupId} from user ${userId}`);
          await handleAdventureChoice(message);
          return;
        }
      }

      // Tangani respons untuk game Dadu
      if (await handleDaduGame(message)) return;

      // Tangani respons untuk Tic Tac Toe
      if (await handleTicTacToeResponse(message)) return;

      // Jika pesan tidak tertangani, gunakan handler non-command
      if (isAuthorized) {
        const klasemenHandled = await handleKlasemenResponse(message);
        if (!klasemenHandled) {
          await handleNonCommandMessage(message, chat, sender);
        }
      }
    }
  } catch (error) {
    logger.error("Error in messageHandler:", error);
    // Jangan mengirim error ke pengguna untuk menghindari kebocoran informasi
  }
};

export default messageHandler;
