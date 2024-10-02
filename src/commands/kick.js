import logger from '../utils/logger.js';

const kick = async (message) => {
    try {
        const chat = await message.getChat();
        const mentionedIds = await message.getMentions();
        
        if (mentionedIds.length > 0) {
            for (let participant of mentionedIds) {
                await chat.removeParticipants([participant.id._serialized]);
            }
            await message.reply("Pengguna yang ditandai telah dikeluarkan dari grup.");
        } else {
            await message.reply("Mention pengguna yang ingin dikeluarkan.");
        }
    } catch (error) {
        logger.error("Error in kick command:", error);
        await message.reply("Terjadi kesalahan saat mengeluarkan anggota. Mohon coba lagi.");
    }
};

export default kick;