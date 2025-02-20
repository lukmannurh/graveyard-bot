import axios from "axios";
import logger from "../utils/logger.js";
import pkg from "whatsapp-web.js";
const { MessageMedia } = pkg;

const animeRecommendation = async (message, args) => {
  try {
    const command = args[0]?.toLowerCase();
    const params = args.slice(1).join(" ");
    let apiUrl = "https://api.jikan.moe/v4/anime";
    let queryParams = { limit: 10 };
    let replyMessage = "";
    switch (command) {
      case "genre":
        queryParams.genres = params;
        replyMessage = `Rekomendasi Anime Genre ${params}:\n\n`;
        break;
      case "season":
        const [year, season] = params.split(" ");
        apiUrl = `https://api.jikan.moe/v4/seasons/${year}/${season}`;
        replyMessage = `Anime Musim ${season.charAt(0).toUpperCase() + season.slice(1)} ${year}:\n\n`;
        break;
      case "top":
        apiUrl = "https://api.jikan.moe/v4/top/anime";
        replyMessage = "Top 10 Anime:\n\n";
        break;
      case "upcoming":
        apiUrl = "https://api.jikan.moe/v4/seasons/upcoming";
        replyMessage = "Anime yang Akan Datang:\n\n";
        break;
      default:
        queryParams.q = args.join(" ");
        replyMessage = `Hasil Pencarian Anime untuk "${args.join(" ")}":\n\n`;
    }
    const response = await axios.get(apiUrl, { params: queryParams });
    const animes = response.data.data.slice(0, 10);
    if (animes.length === 0) {
      await message.reply("Maaf, tidak ditemukan anime yang sesuai dengan kriteria tersebut.");
      return;
    }
    for (const [index, anime] of animes.entries()) {
      replyMessage += `${index + 1}. ${anime.title}\n`;
      replyMessage += `   Rating: ${anime.score || "N/A"}\n`;
      replyMessage += `   Episode: ${anime.episodes || "N/A"}\n`;
      replyMessage += `   Status: ${anime.status || "N/A"}\n\n`;
      if (anime.images?.jpg?.image_url) {
        const media = await MessageMedia.fromUrl(anime.images.jpg.image_url);
        await message.reply(media, null, { caption: `${index + 1}. ${anime.title}` });
      }
    }
    await message.reply(replyMessage);
  } catch (error) {
    logger.error("Error in animeRecommendation:", error);
    await message.reply("Terjadi kesalahan saat mengambil rekomendasi anime. Mohon coba lagi nanti.");
  }
};

export default animeRecommendation;
