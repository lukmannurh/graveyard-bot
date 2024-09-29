import { addAuthorizedGroup, removeAuthorizedGroup, isGroupAuthorized } from '../utils/authorizedGroups.js';
import { OWNER_NUMBER } from '../config/index.js';
import logger from '../utils/logger.js';

async function authorizeGroup(message, args) {
    try {
        const chat = await message.getChat();
        const sender = await message.getContact();
        const cleanSenderId = sender.id.user.replace('@c.us', '');

        console.log('Authorize command received');
        console.log('Sender ID:', sender.id.user);
        console.log('Cleaned Sender ID:', cleanSenderId);
        console.log('OWNER_NUMBER in authorizeGroup:', OWNER_NUMBER);
        console.log('Is sender owner?', cleanSenderId === OWNER_NUMBER);
        console.log('Arguments:', args);

        if (!chat.isGroup) {
            await message.reply('Perintah ini hanya bisa digunakan di dalam grup.');
            return;
        }

        if (cleanSenderId !== OWNER_NUMBER) {
            await message.reply('Hanya pemilik bot yang dapat menggunakan perintah ini.');
            return;
        }

        const groupId = chat.id._serialized;

        if (args[0] === 'add') {
            const result = await addAuthorizedGroup(groupId);
            if (result) {
                await message.reply('Grup ini telah diotorisasi untuk menggunakan bot.');
            } else {
                await message.reply('Grup ini sudah diotorisasi sebelumnya.');
            }
        } else if (args[0] === 'remove') {
            const result = await removeAuthorizedGroup(groupId);
            if (result) {
                await message.reply('Otorisasi grup ini untuk menggunakan bot telah dicabut.');
            } else {
                await message.reply('Grup ini tidak dalam daftar grup yang diotorisasi.');
            }
        } else {
            await message.reply('Penggunaan: .authorize add/remove');
        }

        // Log status otorisasi grup setelah operasi
        const isAuthorized = await isGroupAuthorized(groupId);
        console.log(`Group ${groupId} authorization status: ${isAuthorized}`);

    } catch (error) {
        logger.error('Error in authorizeGroup command:', error);
        await message.reply('Terjadi kesalahan saat mengotorisasi grup. Silakan coba lagi.');
    }
}

export default authorizeGroup;