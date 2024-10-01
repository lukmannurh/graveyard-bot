import pkg from 'whatsapp-web.js';
const { Contact } = pkg;
import logger from '../utils/logger.js';

const bandarsabu = async (message) => {
    try {
        const client = message.client;
        const contactId = '6285768971424@c.us';
        let contact = await client.getContactById(contactId);

        if (!contact) {
            logger.info('Contact not found, creating new contact');
            contact = new Contact(client, {
                id: contactId,
                name: 'Imam Bandar Sabu Lampung'
            });
            await contact.save();
        }

        await message.reply(contact);
        logger.info('Bandar sabu contact sent successfully');
    } catch (error) {
        logger.error('Error in bandarsabu command:', error);
        await message.reply('Terjadi kesalahan saat mengirim kontak. Mohon coba lagi.');
    }
};

export { bandarsabu };