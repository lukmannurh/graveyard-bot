import * as commands from "../commands/index.js";
import { GENERAL_COMMANDS, ADMIN_COMMANDS } from "../commands/index.js";
import { PREFIX } from "../config/constants.js";
import logger from "../utils/logger.js";

export const handleRegularCommand = async (message, chat, sender, isGroupAdmin) => {
  const [command, ...args] = message.body.slice(PREFIX.length).trim().split(/ +/);
  const commandName = command.toLowerCase();
  logger.info(`Attempting to execute regular command: ${commandName} with args: ${args.join(" ")}`);
  logger.debug(`Available commands: ${Object.keys(commands)}`);
  logger.debug(`Is group admin: ${isGroupAdmin}`);

  const availableCommands = [
    ...GENERAL_COMMANDS,
    ...(isGroupAdmin ? ADMIN_COMMANDS : [])
  ];
  logger.info(`Commands available for user: ${availableCommands}`);

  if (availableCommands.includes(commandName)) {
    const commandFunction = commands[commandName];
    if (commandFunction) {
      try {
        await commandFunction(message, args);
        logger.info(`Command ${commandName} executed successfully`);
      } catch (error) {
        logger.error(`Error executing command ${commandName}:`, error);
        await message.reply(`Terjadi kesalahan saat menjalankan perintah ${commandName}. Mohon coba lagi nanti.`);
      }
    } else {
      logger.warn(`Command function tidak ditemukan untuk: ${commandName}`);
      await message.reply("Perintah tidak dapat dieksekusi. Mohon hubungi admin bot.");
    }
  } else {
    logger.warn(`Perintah tidak dikenal atau tidak diizinkan: ${commandName}`);
    await message.reply("Perintah tidak dikenali atau Anda tidak memiliki izin untuk menggunakannya. Gunakan .menu untuk melihat daftar perintah yang tersedia.");
  }
};
