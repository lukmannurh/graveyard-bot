import { OWNER_COMMANDS, GENERAL_COMMANDS } from "../commands/index.js";
import exportedCommands from "../commands/index.js";
import * as commands from "../commands/index.js";
import { PREFIX, OWNER_NUMBER } from "../config/constants.js";
import logger from "../utils/logger.js";
import authorizeGroup from "../commands/authorizeGroup.js";
import { handleRegularCommand } from "./regularCommandHandler.js";
import { handleNonCommandMessage } from "./nonCommandHandler.js";
import adventureManager from "../utils/adventureManager.js";
import { handleAdventureChoice } from "../commands/adventureCommand.js";

function isOwner(userId) {
  return OWNER_NUMBER.includes(userId.replace('@c.us', ''));
}

export const handleOwnerCommand = async (message, groupId) => {
  const [command, ...args] = message.body.slice(PREFIX.length).trim().split(/ +/);
  const commandName = command.toLowerCase();
  const sender = await message.getContact();
  const userId = sender.id._serialized;
  logger.info(`Owner command received: ${commandName} from ${userId}`);

  if (!isOwner(userId)) {
    logger.warn(`Non-owner ${userId} mencoba menggunakan perintah owner: ${commandName}`);
    return;
  }

  if (commandName === "authorize") {
    try {
      await authorizeGroup(message, args);
      logger.info("Authorize command executed successfully");
    } catch (error) {
      logger.error("Error executing authorize command:", error);
      await message.reply("Terjadi kesalahan saat menjalankan perintah authorize. Mohon coba lagi.");
    }
  } else if (OWNER_COMMANDS.includes(commandName)) {
    const commandFunction = commands[commandName];
    if (commandFunction) {
      logger.info(`Executing owner command: ${commandName}`);
      try {
        await commandFunction(message, args);
        logger.info(`Owner command ${commandName} executed successfully`);
      } catch (error) {
        logger.error(`Error executing owner command ${commandName}:`, error);
        await message.reply(`Terjadi kesalahan saat menjalankan perintah ${commandName}. Mohon coba lagi nanti.`);
      }
    } else {
      logger.warn(`Command function tidak ditemukan untuk owner command: ${commandName}`);
    }
  } else if (GENERAL_COMMANDS.includes(commandName)) {
    const commandFunction = exportedCommands[commandName];
    if (commandFunction) {
      logger.info(`Executing general command for owner: ${commandName}`);
      try {
        await commandFunction(message, args);
        logger.info(`General command ${commandName} executed successfully for owner`);
      } catch (error) {
        logger.error(`Error executing general command ${commandName} for owner:`, error);
        await message.reply(`Terjadi kesalahan saat menjalankan perintah ${commandName}. Mohon coba lagi nanti.`);
      }
    } else {
      logger.warn(`Unknown general command: ${commandName}`);
      await message.reply("Perintah tidak dikenali. Gunakan .menu untuk melihat daftar perintah yang tersedia.");
    }
  } else if (message.body.startsWith(PREFIX)) {
    const chat = await message.getChat();
    await handleRegularCommand(message, chat, sender, true);
  } else {
    const chat = await message.getChat();
    if (adventureManager.isGameActive(groupId) && /^\d+$/.test(message.body.trim())) {
      logger.debug(`Processing owner's adventure choice: ${message.body} for group ${groupId}`);
      try {
        await handleAdventureChoice(message);
      } catch (error) {
        logger.error("Error processing owner's adventure choice:", error);
      }
    } else {
      await handleNonCommandMessage(message, chat, sender);
    }
  }
};
