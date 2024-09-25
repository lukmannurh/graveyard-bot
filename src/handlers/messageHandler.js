const commands = require('../commands');
const { isAdmin } = require('../utils/adminChecker');
const { PREFIX } = require('../config');
const ai = require('../commands/ai');
const { containsForbiddenWord } = require('../utils/wordFilter');
// const { isGroupAuthorized, addAuthorizedGroup, removeAuthorizedGroup } = require('../utils/authorizedGroups');

const messageHandler = async (message) => {
    const chat = await message.getChat();
    if (!chat.isGroup) return;

    // Check if the group is authorized
    // if (!isGroupAuthorized(chat.id._serialized)) {
    //     console.log(`Unauthorized access attempt in group: ${chat.name}`);
    //     return;
    // }

    // Check for forbidden words
    if (containsForbiddenWord(message.body)) {
        await message.reply('PERBAIKI BAHASAMU');
        return;
    }

    if (message.hasMedia && message.body.trim() !== '') {
        await ai(message, message.body.split(' '));
        return;
    }

    const [command, ...args] = message.body.split(' ');
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