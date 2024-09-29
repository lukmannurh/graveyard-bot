import { addAuthorizedGroup, removeAuthorizedGroup, isGroupAuthorized } from '../utils/authorizedGroups.js';
import { OWNER_NUMBER } from '../config/index.js';
import logger from '../utils/logger.js';

async function authorizeGroup(message, args) {
    try {
        console.log('Authorize command received with args:', args);
        
        const chat = await message.getChat();
        const sender = await message.getContact();
        const cleanSenderId = sender.id.user.replace('@c.us', '');
        const groupId = chat.id._serialized;

        console.log('Group ID:', groupId);
        console.log('Sender ID:', sender.id.user);
        console.log('Cleaned Sender ID:', cleanSenderId);
        console.log('OWNER_NUMBER:', OWNER_NUMBER);

        if (!chat.isGroup) {
            await message.reply('Perintah ini hanya bisa digunakan di dalam grup.');
            return;
        }

        if (cleanSenderId !== OWNER_NUMBER) {
            await message.reply('Hanya pemilik bot yang dapat menggunakan perintah ini.');
            return;
        }

        if (args[0] === 'add') {
            const result = await addAuthorizedGroup(groupId);
            console.log('Add result:', result);
            await message.reply(result ? 'Grup ini telah diotorisasi untuk menggunakan bot.' : 'Grup ini sudah diotorisasi sebelumnya.');
        } else if (args[0] === 'remove') {
            const result = await removeAuthorizedGroup(groupId);
            console.log('Remove result:', result);
            await message.reply(result ? 'Otorisasi grup ini untuk menggunakan bot telah dicabut.' : 'Grup ini tidak dalam daftar grup yang diotorisasi.');
        } else {
            await message.reply('Penggunaan: .authorize add/remove');
        }

        const isAuthorized = await isGroupAuthorized(groupId);
        console.log(`Group ${groupId} authorization status after operation: ${isAuthorized}`);

    } catch (error) {
        logger.error('Error in authorizeGroup command:', error);
        await message.reply('Terjadi kesalahan saat mengotorisasi grup. Silakan coba lagi.');
    }
}

export default authorizeGroup;