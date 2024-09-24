const axios = require('axios');

const ai = async (message, args) => {
    const prompt = args.join(' ');
    if (!prompt) {
        await message.reply('Silakan berikan pertanyaan atau prompt setelah perintah .ai');
        return;
    }

    if (prompt.length > 500) { // Sesuaikan dengan batasan API jika ada
        await message.reply('Maaf, prompt terlalu panjang. Mohon singkat pertanyaan Anda.');
        return;
    }

    try {
        console.log('Sending request to Gemini API with prompt:', prompt);
        const response = await axios.get('https://mr-apis.com/api/ai/geminitext', {
            params: { prompt: prompt },
            timeout: 30000 // 30 detik timeout
        });

        console.log('Full API response:', response.data);

        if (response.status === 429) {
            await message.reply('Maaf, permintaan terlalu sering. Silakan coba lagi nanti.');
            return;
        }

        const aiResponse = response.data.geminitext || response.data.response || response.data.message;
        console.log('AI Response:', aiResponse);

        if (!aiResponse || aiResponse.trim() === '') {
            await message.reply('Maaf, AI tidak memberikan respons yang valid. Silakan coba lagi.');
        } else {
            // Jika respons terlalu panjang, potong dan tambahkan elipsis
            const maxLength = 1000; // Sesuaikan dengan batas karakter WhatsApp jika perlu
            const trimmedResponse = aiResponse.length > maxLength 
                ? aiResponse.substring(0, maxLength - 3) + '...'
                : aiResponse;
            await message.reply(trimmedResponse);
        }
    } catch (error) {
        console.error('Error in AI command:', error);
        if (error.response) {
            console.error('API response error:', error.response.data);
            console.error('API response status:', error.response.status);
            console.error('API response headers:', error.response.headers);
            
            if (error.response.status === 429) {
                await message.reply('Maaf, permintaan terlalu sering. Silakan coba lagi nanti.');
            } else {
                await message.reply(`Maaf, terjadi kesalahan saat memproses permintaan AI. Status: ${error.response.status}`);
            }
        } else if (error.request) {
            console.error('No response received:', error.request);
            await message.reply('Maaf, tidak ada respons dari AI. Silakan coba lagi nanti.');
        } else {
            console.error('Error details:', error.message);
            await message.reply('Maaf, terjadi kesalahan internal saat memproses permintaan AI.');
        }
    }
};

module.exports = ai;