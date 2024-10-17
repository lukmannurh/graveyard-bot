import { handleOwnerCommand } from "./ownerCommandHandler.js";
import { handleRegularCommand } from "./regularCommandHandler.js";
import { handleSpecificCommands } from "./specificCommandHandler.js";
import logger from "../utils/logger.js";
import { PREFIX } from "../config/constants.js";

export const handleCommand = async (message, isAuthorized, isOwnerUser, isGroupAdmin) => {
  const [command, ...args] = message.body.slice(PREFIX.length).trim().split(/ +/);
  const commandName = command.toLowerCase();

  if (await handleSpecificCommands(message, commandName, args)) return;

  if (isOwnerUser) {
    await handleOwnerCommand(message);
  } else if (isAuthorized) {
    await handleRegularCommand(message, isGroupAdmin);
  } else {
    logger.debug(`Unauthorized group, ignoring command from non-owner`);
  }
};