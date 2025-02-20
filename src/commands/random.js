import pkg from "whatsapp-web.js";
const { MessageMedia } = pkg;
import { createCanvas } from "canvas";
import logger from "../utils/logger.js";

const random = async (message, args) => {
  try {
    logger.info("Random command called with arguments:", args);
    if (args.length < 3) {
      await message.reply("Format: .random [jumlah tim] [nama1] [nama2] ... (minimal 2 nama)");
      return;
    }
    const numTeams = parseInt(args[0]);
    if (isNaN(numTeams) || numTeams < 2) {
      await message.reply("Jumlah tim harus berupa angka dan minimal 2.");
      return;
    }
    const names = args.slice(1);
    if (names.length < numTeams) {
      await message.reply(`Masukkan setidaknya ${numTeams} nama untuk ${numTeams} tim.`);
      return;
    }
    const shuffledNames = names.sort(() => Math.random() - 0.5);
    const teams = Array.from({ length: numTeams }, () => []);
    shuffledNames.forEach((name, index) => {
      teams[index % numTeams].push(name);
    });
    let resultText = "Hasil Pembagian Tim:\n\n";
    teams.forEach((team, index) => {
      resultText += `TIM ${index + 1}\n`;
      team.forEach((name) => {
        resultText += `• ${name}\n`;
      });
      resultText += "===============\n";
    });
    await message.reply(resultText);
    logger.info("Text result sent successfully");
    const canvasWidth = 800;
    const canvasHeight = 600;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = "#333333";
    ctx.font = "bold 40px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Tim Acak", canvasWidth / 2, 60);
    ctx.strokeStyle = "#cccccc";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 80);
    ctx.lineTo(canvasWidth - 50, 80);
    ctx.stroke();
    const teamWidth = (canvasWidth - 100) / numTeams;
    const teamHeight = canvasHeight - 120;
    teams.forEach((team, teamIndex) => {
      const xPos = 50 + teamIndex * teamWidth;
      const yStart = 100;
      ctx.strokeStyle = "#333333";
      ctx.lineWidth = 2;
      ctx.strokeRect(xPos, yStart, teamWidth, teamHeight);
      ctx.fillStyle = "#333333";
      ctx.font = "bold 24px Arial";
      ctx.textAlign = "center";
      ctx.fillText(`TIM ${teamIndex + 1}`, xPos + teamWidth / 2, yStart + 30);
      ctx.strokeStyle = "#cccccc";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(xPos + 20, yStart + 50);
      ctx.lineTo(xPos + teamWidth - 20, yStart + 50);
      ctx.stroke();
      ctx.font = "18px Arial";
      ctx.textAlign = "left";
      team.forEach((name, nameIndex) => {
        ctx.fillText(`${nameIndex + 1}. ${name}`, xPos + 10, yStart + 80 + nameIndex * 30);
      });
      ctx.strokeStyle = "#333333";
      ctx.lineWidth = 2;
      const cornerSize = 10;
      ctx.beginPath();
      ctx.moveTo(xPos, yStart + cornerSize);
      ctx.lineTo(xPos, yStart);
      ctx.lineTo(xPos + cornerSize, yStart);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(xPos + teamWidth - cornerSize, yStart);
      ctx.lineTo(xPos + teamWidth, yStart);
      ctx.lineTo(xPos + teamWidth, yStart + cornerSize);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(xPos, yStart + teamHeight - cornerSize);
      ctx.lineTo(xPos, yStart + teamHeight);
      ctx.lineTo(xPos + cornerSize, yStart + teamHeight);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(xPos + teamWidth - cornerSize, yStart + teamHeight);
      ctx.lineTo(xPos + teamWidth, yStart + teamHeight);
      ctx.lineTo(xPos + teamWidth, yStart + teamHeight - cornerSize);
      ctx.stroke();
    });
    const buffer = canvas.toBuffer("image/png");
    const media = new MessageMedia("image/png", buffer.toString("base64"));
    await message.reply(media, message.from, { caption: "Visualisasi Tim Acak" });
    logger.info("Image sent successfully");
  } catch (error) {
    logger.error("Error in random command:", error);
    await message.reply("Terjadi kesalahan saat membuat tim acak. Mohon coba lagi.");
  }
};

export default random;
