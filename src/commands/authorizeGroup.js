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

        console.log('Authorize command - Group ID:', groupId);
        console.log('Authorize command - Sender ID:', sender.id.user);
        console.log('Authorize command - Cleaned Sender ID:', cleanSenderId);
        console.log('Authorize command - OWNER_NUMBER:', OWNER_NUMBER);

        if (!chat.isGroup) {
            console.log('Authorize command - Not a group chat');
            await message.reply('Perintah ini hanya bisa digunakan di dalam grup.');
            return;
        }

        if (cleanSenderId !== OWNER_NUMBER) {
            console.log('Authorize command - Sender is not owner');
            await message.reply('Hanya pemilik bot yang dapat menggunakan perintah ini.');
            return;
        }

        if (args[0] === 'remove') {
            console.log('Authorize command - Removing group');
            const result = await removeAuthorizedGroup(groupId);
            console.log('Authorize command - Remove result:', result);
            await message.reply(result ? 'Otorisasi grup ini untuk menggunakan bot telah dicabut.' : 'Grup ini tidak dalam daftar grup yang diotorisasi.');
        } else if (args[0] === 'add') {
            console.log('Authorize command - Adding group');
            const result = await addAuthorizedGroup(groupId);
            console.log('Authorize command - Add result:', result);
            await message.reply(result ? 'Grup ini telah diotorisasi untuk menggunakan bot.' : 'Grup ini sudah diotorisasi sebelumnya.');
        } else {
            console.log('Authorize command - Invalid argument');
            await message.reply('Penggunaan: .authorize add/remove');
        }

        const isAuthorized = await isGroupAuthorized(groupId);
        console.log(`Authorize command - Group ${groupId} authorization status after operation: ${isAuthorized}`);

    } catch (error) {
        console.error('Error in authorizeGroup command:', error);
        logger.error('Error in authorizeGroup command:', error);
        await message.reply('Terjadi kesalahan saat mengotorisasi grup. Silakan coba lagi.');
    }
}

export default authorizeGroup;