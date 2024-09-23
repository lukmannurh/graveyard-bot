const tagall = async (message) => {
    const chat = await message.getChat();
    let text = "";
    let mentions = [];

    for(let participant of chat.participants) {
        const contact = await message.client.getContactById(participant.id._serialized);
        mentions.push(contact);
        text += `@${participant.id.user} `;
    }

    await chat.sendMessage(text, { mentions });
};

module.exports = tagall;