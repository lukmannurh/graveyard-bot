const commands = require('../commands');
const { isAdmin } = require('../utils/adminChecker');
const { PREFIX } = require('../config');

const messageHandler = async (message) => {
    const chat = await message.getChat();
    if (!chat.isGroup) return;

    const [command, ...args] = message.body.split(' ');
    if (!command.startsWith(PREFIX)) return;

    const commandName = command.slice(PREFIX.length).toLowerCase();
    const commandFunction = commands[commandName];

    if (commandFunction) {
        const sender = await message.getContact();
        if (commands.ADMIN_COMMANDS.includes(commandName) && !isAdmin(chat, sender)) {
            await message.reply('Anda tidak memiliki izin untuk menggunakan perintah ini.');
            return;
        }
        await commandFunction(message, args);
    }
};

module.exports = messageHandler;