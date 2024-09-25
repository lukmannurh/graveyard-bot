const { addAuthorizedGroup, removeAuthorizedGroup } = require('../utils/authorizedGroups');

async function authorizeGroup(message, args) {
    const chat = await message.getChat();
    if (!chat.isGroup) {
        await message.reply('Perintah ini hanya bisa digunakan di dalam grup.');
        return;
    }

    const sender = await message.getContact();
    if (sender.id.user !== process.env.OWNER_NUMBER) {
        await message.reply('Hanya pemilik bot yang dapat menggunakan perintah ini.');
        return;
    }

    if (args[0] === 'add') {
        addAuthorizedGroup(chat.id._serialized);
        await message.reply('Grup ini telah diotorisasi untuk menggunakan bot.');
    } else if (args[0] === 'remove') {
        removeAuthorizedGroup(chat.id._serialized);
        await message.reply('Otorisasi grup ini untuk menggunakan bot telah dicabut.');
    } else {
        await message.reply('Penggunaan: .authorize add/remove');
    }
}

module.exports = authorizeGroup;