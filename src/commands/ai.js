const axios = require('axios');

const ai = async (message, args) => {
    const prompt = args.join(' ');
    if (!prompt) {
        await message.reply('Silakan berikan pertanyaan atau prompt setelah perintah .ai');
        return;
    }

    try {
        const response = await axios.post(
            'https://api-inference.huggingface.co/models/gpt2',
            { inputs: prompt },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const aiResponse = response.data[0].generated_text;
        await message.reply(aiResponse);
    } catch (error) {
        console.error('Error in AI command:', error);
        await message.reply('Maaf, terjadi kesalahan saat memproses permintaan AI.');
    }
};

module.exports = ai;