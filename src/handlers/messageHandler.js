const commands = require('../commands');
const { isAdmin } = require('../utils/adminChecker');
const { PREFIX } = require('../config');
const ai = require('../commands/ai');
const { containsForbiddenWord } = require('../utils/wordFilter');
const { isGroupAuthorized, addAuthorizedGroup, removeAuthorizedGroup } = require('../utils/authorizedGroups');

const messageHandler = async (message) => {
    const chat = await message.getChat();
    if (!chat.isGroup) return;

    console.log(`Received message in group: ${chat.name}, ID: ${chat.id._serialized}`);

    const [command, ...args] = message.body.split(' ');
    if (command.startsWith(PREFIX)) {
        const commandName = command.slice(PREFIX.length).toLowerCase();

        // Allow .authorize command even if the group is not authorized
        if (commandName === 'authorize') {
            const sender = await message.getContact();
            if (sender.id.user === process.env.OWNER_NUMBER) {
                if (args[0] === 'add') {
                    addAuthorizedGroup(chat.id._serialized);
                    await message.reply('Grup ini telah diotorisasi untuk menggunakan bot.');
                } else if (args[0] === 'remove') {
                    removeAuthorizedGroup(chat.id._serialized);
                    await message.reply('Otorisasi grup ini untuk menggunakan bot telah dicabut.');
                } else {
                    await message.reply('Penggunaan: .authorize add/remove');
                }
            } else {
                await message.reply('Hanya pemilik bot yang dapat menggunakan perintah ini.');
            }
            return;
        }
    }

    // Check if the group is authorized for other commands
    if (!isGroupAuthorized(chat.id._serialized)) {
        console.log(`Unauthorized access attempt in group: ${chat.name}, ID: ${chat.id._serialized}`);
        return;
    }

    // Check for forbidden words
    if (containsForbiddenWord(message.body)) {
        await message.reply('PERBAIKI BAHASAMU');
        return;
    }

    if (message.hasMedia && message.body.trim() !== '') {
        await ai(message, message.body.split(' '));
        return;
    }

    if (command.startsWith(PREFIX)) {
        const commandName = command.slice(PREFIX.length).toLowerCase();
        const commandFunction = commands[commandName];

        if (commandFunction) {
            const sender = await message.getContact();
            if (commands.ADMIN_COMMANDS.includes(commandName) && !isAdmin(chat, sender)) {
                await message.reply('Anda tidak memiliki izin untuk menggunakan perintah ini.');
                return;
            }
            await commandFunction(message, args);
        } else if (commandName === 'ai') {
            await ai(message, args);
        }
    }
};

module.exports = messageHandler;