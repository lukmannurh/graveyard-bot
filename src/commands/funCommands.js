import logger from "../utils/logger.js";

const cekjomok = async (message) => {
  try {
    const sender = await message.getContact();
    const jomokPercentage = Math.floor(Math.random() * 101);
    const response = `@${sender.id.user} tingkat jomok kamu adalah ${jomokPercentage}%`;
    await message.reply(response, null, { mentions: [sender] });
    logger.info(`Cekjomok command executed for ${sender.id.user}: ${jomokPercentage}%`);
  } catch (error) {
    logger.error("Error in cekjomok command:", error);
    await message.reply("Terjadi kesalahan saat mengecek tingkat jomok. Mohon coba lagi.");
  }
};

export { cekjomok };
