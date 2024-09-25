const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

async function mediaToGenerativePart(media) {
    return {
        inlineData: {
            data: media.data,
            mimeType: media.mimetype
        },
    };
}

async function run(textPrompt, mediaPart) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        let prompt = [{ text: textPrompt }];
        if (mediaPart) {
            prompt.unshift(mediaPart);
        }

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        if (text) {
            console.log("Generated Text:", text);
            return text;
        } else {
            console.error("This problem is related to Model Limitations and API Rate Limits");
            return "Maaf, terjadi masalah dalam menghasilkan respons. Silakan coba lagi nanti.";
        }
    } catch (error) {
        console.error("Error in run function:", error);
        if (error.message.includes("model is not supported")) {
            return "Maaf, fitur ini sedang dalam pemeliharaan. Silakan coba lagi nanti.";
        }
        return "Oops, an error occurred. Please try again later.";
    }
}

function formatResponse(text) {
    // Mengubah **text** menjadi *text*
    return text.replace(/\*\*(.*?)\*\*/g, '*$1*');
}

async function ai(message, args) {
    try {
        let mediaPart = null;
        let textPrompt = args.join(' ');

        if (message.hasMedia) {
            const media = await message.downloadMedia();
            mediaPart = await mediaToGenerativePart(media);
        }

        if (!textPrompt && !mediaPart) {
            return; // Jika tidak ada teks dan tidak ada gambar, abaikan pesan
        }

        let responseText = await run(textPrompt, mediaPart);
        responseText = formatResponse(responseText);
        await message.reply(responseText);
    } catch (error) {
        console.error("Error in AI function:", error);
        await message.reply("Terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi nanti.");
    }
}

module.exports = ai;