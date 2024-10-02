import pkg from 'whatsapp-web.js';
const { MessageMedia } = pkg;
import logger from '../utils/logger.js';

export const getProfilePicture = async (message) => {
    try {
        const chat = await message.getChat();
        const mentionedUsers = await message.getMentions();

        if (mentionedUsers.length === 0) {
            await message.reply('Mohon tag pengguna yang ingin Anda lihat foto profilnya.');
            return;
        }

        const targetUser = mentionedUsers[0];
        logger.debug(`Fetching profile picture for user: ${targetUser.id._serialized}`);

        const profilePicUrl = await targetUser.getProfilePicUrl();

        if (!profilePicUrl) {
            await message.reply('Pengguna ini tidak memiliki foto profil.');
            return;
        }

        const media = await MessageMedia.fromUrl(profilePicUrl);
        await chat.sendMessage(media, { caption: `Foto profil dari @${targetUser.id.user}` });

        logger.info(`Profile picture sent for user: ${targetUser.id._serialized}`);
    } catch (error) {
        logger.error('Error in getProfilePicture command:', error);
        await message.reply('Terjadi kesalahan saat mengambil foto profil. Mohon coba lagi.');
    }
};

export default getProfilePicture;