import { handleCommand } from "./commandHandler.js";
import { handleNonCommand } from "./nonCommandHandler.js";
import {
  isGroupAuthorized,
  isUserBanned,
  isOwner,
  isAdmin,
} from "../utils/authCheckers.js";
import { checkAndHandleForbiddenWords } from "../utils/moderationHelpers.js";
import logger from "../utils/logger.js";
import groupStats from "../utils/groupStats.js";
import { PREFIX } from "../config/constants.js";

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

    if (message.fromMe === false) {
      groupStats.logMessage(groupId, userId);
    }

    const isAuthorized = isGroupAuthorized(groupId);
    const isOwnerUser = isOwner(userId);
    const isGroupAdmin = await isAdmin(chat, sender);

    if (await checkAndHandleForbiddenWords(message, groupId, userId)) return;

    if (message.body.startsWith(PREFIX)) {
      await handleCommand(message, isAuthorized, isOwnerUser, isGroupAdmin);
    } else {
      await handleNonCommand(message, isAuthorized);
    }
  } catch (error) {
    logger.error("Error in messageHandler:", error);
  }
};

export default messageHandler;
