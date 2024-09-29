import { addAuthorizedGroup, removeAuthorizedGroup } from '../utils/authorizedGroups.js';
import { OWNER_NUMBER } from '../config/index.js';
import logger from '../utils/logger.js';

console.log('Authorize command received');
console.log('Sender ID:', sender.id.user);
console.log('OWNER_NUMBER in authorizeGroup:', OWNER_NUMBER);
console.log('Is sender owner?', sender.id.user === OWNER_NUMBER);

async function authorizeGroup(message, args) {
    try {
        const chat = await message.getChat();
        if (!chat.isGroup) {
            await message.reply('Perintah ini hanya bisa digunakan di dalam grup.');
            return;
        }

        const sender = await message.getContact();
        if (sender.id.user !== OWNER_NUMBER) {
            await message.reply('Hanya pemilik bot yang dapat menggunakan perintah ini.');
            return;
        }

        if (args[0] === 'add') {
            await addAuthorizedGroup(chat.id._serialized);
            await message.reply('Grup ini telah diotorisasi untuk menggunakan bot.');
        } else if (args[0] === 'remove') {
            await removeAuthorizedGroup(chat.id._serialized);
            await message.reply('Otorisasi grup ini untuk menggunakan bot telah dicabut.');
        } else {
            await message.reply('Penggunaan: .authorize add/remove');
        }
    } catch (error) {
        logger.error('Error in authorizeGroup command:', error);
        await message.reply('Terjadi kesalahan saat mengotorisasi grup. Silakan coba lagi.');
    }
}

export default authorizeGroup;