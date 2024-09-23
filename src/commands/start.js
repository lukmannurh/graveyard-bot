const predictionManager = require('../utils/predictionManager');
const { isAdmin } = require('../utils/adminChecker');

const start = async (message, args) => {
    if (args.length !== 3) {
        await message.reply("Format tidak sesuai. Gunakan: .start [nama tim 1] [nama tim 2] [hadiah]");
        return;
    }

    const [team1, team2, reward] = args;
    predictionManager.startMatch(team1, team2, reward);

    let announcementText = `Kuis Tebak Skor ${team1} VS ${team2} reward pemenang ${reward}\n\n`;
    await message.reply(announcementText);

    const chat = await message.getChat();
    const sender = await message.getContact();
    if (isAdmin(chat, sender)) {
        await tagAll(chat);
    }
};

const tagAll = async (chat) => {
    let text = "";
    let mentions = [];

    for(let participant of chat.participants) {
        const contact = await chat.client.getContactById(participant.id._serialized);
        mentions.push(contact);
        text += `@${participant.id.user} `;
    }

    await chat.sendMessage(text, { mentions });
};

module.exports = start;