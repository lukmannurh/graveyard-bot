import axios from 'axios';
import { createCanvas, loadImage } from 'canvas';
import pkg from 'whatsapp-web.js';
const { MessageMedia } = pkg;
import logger from '../utils/logger.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FOTMOB_API_URL = 'https://www.fotmob.com/api';
const INDONESIA_TEAM_ID = 8068; // ID Tim Nasional Indonesia di Fotmob

async function getIndonesiaMatches() {
    try {
        const response = await axios.get(`${FOTMOB_API_URL}/teams`, {
            params: { id: INDONESIA_TEAM_ID, tab: 'fixtures' }
        });
        return response.data;
    } catch (error) {
        logger.error('Error fetching Indonesia matches:', error);
        throw new Error('Gagal mengambil data pertandingan Indonesia.');
    }
}

async function createMatchCard(match, isFixture = true) {
    const canvas = createCanvas(500, 150);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 500, 150);

    // Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;

    // Card
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(10, 10, 480, 130);

    // Reset shadow
    ctx.shadowColor = 'transparent';

    // Text
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';

    const homeTeam = match.home.name;
    const awayTeam = match.away.name;
    const date = new Date(match.status.startDateStr);
    const dateStr = date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    ctx.fillText(`${homeTeam} vs ${awayTeam}`, 250, 40);
    ctx.font = '14px Arial';
    ctx.fillText(dateStr, 250, 70);
    ctx.fillText(timeStr, 250, 90);

    if (!isFixture) {
        ctx.font = 'bold 24px Arial';
        ctx.fillText(`${match.home.score} - ${match.away.score}`, 250, 120);
    } else {
        ctx.font = '14px Arial';
        ctx.fillText('Jadwal Pertandingan', 250, 120);
    }

    return canvas;
}

async function createMatchesImage(matches, isFixture = true) {
    const canvas = createCanvas(500, 1550);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(0, 0, 500, 1550);

    // Title
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(isFixture ? 'Jadwal Pertandingan Indonesia' : 'Hasil Pertandingan Indonesia', 250, 40);

    for (let i = 0; i < Math.min(matches.length, 10); i++) {
        const matchCanvas = await createMatchCard(matches[i], isFixture);
        ctx.drawImage(matchCanvas, 0, 70 + i * 150);
    }

    return canvas;
}

export const kingIndo = async (message, args) => {
    try {
        if (args.length === 0) {
            await message.reply('Pilih opsi:\n1. Jadwal pertandingan\n2. Hasil pertandingan');
            return;
        }

        const data = await getIndonesiaMatches();
        let matches;
        let isFixture;

        if (args[0] === '1') {
            matches = data.fixtures.slice(0, 10);
            isFixture = true;
        } else if (args[0] === '2') {
            matches = data.results.slice(0, 10).reverse();
            isFixture = false;
        } else {
            await message.reply('Pilihan tidak valid. Gunakan 1 untuk jadwal atau 2 untuk hasil pertandingan.');
            return;
        }

        const canvas = await createMatchesImage(matches, isFixture);
        const buffer = canvas.toBuffer('image/png');
        const tempFilePath = path.join(__dirname, '../../temp', `kingindo_${Date.now()}.png`);
        await fs.writeFile(tempFilePath, buffer);

        const media = MessageMedia.fromFilePath(tempFilePath);
        await message.reply(media, null, { caption: isFixture ? '10 Pertandingan Berikutnya Tim Nasional Indonesia' : '10 Hasil Pertandingan Terakhir Tim Nasional Indonesia' });

        // Delete the temporary file
        await fs.unlink(tempFilePath);

    } catch (error) {
        logger.error('Error in kingIndo command:', error);
        await message.reply('Terjadi kesalahan saat mengambil data pertandingan. Silakan coba lagi nanti.');
    }
};