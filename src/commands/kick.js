const kick = async (message) => {
    const chat = await message.getChat();
    const mentionedIds = await message.getMentions();
    
    if (mentionedIds.length > 0) {
        for (let participant of mentionedIds) {
            await chat.removeParticipants([participant.id._serialized]);
        }
        await message.reply("Orang ini adalah haters owi dan owo");
    } else {
        await message.reply("Mention pengguna yang ingin dikeluarkan.");
    }
};

module.exports = kick;