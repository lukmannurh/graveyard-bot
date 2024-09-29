import logger from '../utils/logger.js';

const tagall = async (message) => {
    try {
        const chat = await message.getChat();
        let text = "";
        let mentions = [];

        for(let participant of chat.participants) {
            const contact = await message.client.getContactById(participant.id._serialized);
            mentions.push(contact);
            text += `@${participant.id.user} `;
        }

        await chat.sendMessage(text, { mentions });
    } catch (error) {
        logger.error("Error in tagall command:", error);
        await message.reply("Terjadi kesalahan saat menandai semua anggota. Mohon coba lagi.");
    }
};

export default tagall;