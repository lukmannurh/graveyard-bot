import axios from 'axios';
import { createCanvas } from 'canvas';
import logger from '../utils/logger.js';
import pkg from 'whatsapp-web.js';
const { MessageMedia } = pkg;

const FOTMOB_API_URL = 'https://www.fotmob.com/api/leagues';
const LEAGUE_MAPPING = {
  "Premier League": { id: 47, ccode: "ENG" },
  "Champions League": { id: 42, ccode: "INT" },
  "LaLiga": { id: 87, ccode: "ESP" },
  "Serie A": { id: 55, ccode: "ITA" },
  "Bundesliga": { id: 54, ccode: "GER" },
  "Ligue 1": { id: 53, ccode: "FRA" },
  "BRI Liga 1": { id: 403, ccode: "IDN" },
  "Europa Conference League": { id: 73, ccode: "INT" },
  "Europa League": { id: 73, ccode: "INT" },
  "World Cup Qualification AFC": { id: 10197, ccode: "INT" }
};

const pendingKlasemenResponses = new Map();

async function fetchLeagueTable(leagueId) {
  try {
    logger.debug(`Fetching league table for ID: ${leagueId}`);
    const response = await axios.get(`${FOTMOB_API_URL}?id=${leagueId}`);
    logger.debug(`Received response for league ID ${leagueId}`);
    return response.data;
  } catch (error) {
    logger.error(`Error fetching league table for league ID ${leagueId}:`, error);
    throw new Error('Gagal mengambil data klasemen liga.');
  }
}

function formatTeamName(name, maxLength = 30) {
  if (!name) return 'Unknown'.padEnd(maxLength);
  if (name.length <= maxLength) return name.padEnd(maxLength);
  
  const words = name.split(' ');
  let formattedName = words[0];
  for (let i = 1; i < words.length; i++) {
    if (formattedName.length + words[i].length + 1 <= maxLength) {
      formattedName += ' ' + words[i];
    } else {
      formattedName += ' ' + words[i][0] + '.';
      if (formattedName.length >= maxLength) break;
    }
  }
  return formattedName.padEnd(maxLength);
}

function findTableData(obj) {
  if (obj && typeof obj === 'object') {
    if (Array.isArray(obj) && obj.length > 0 && obj[0].name && obj[0].played !== undefined) {
      return obj;
    }
    for (let key in obj) {
      let result = findTableData(obj[key]);
      if (result) return result;
    }
  }
  return null;
}

export async function klasemenLiga(message, args) {
  const groupId = message.from;
  logger.info(`Klasemen Liga command received. Args: ${args}`);
  try {
    if (args.length === 0) {
      let response = "Pilih liga yang ingin dilihat klasemennya:\n\n";
      Object.keys(LEAGUE_MAPPING).forEach((leagueName, index) => {
        response += `${index + 1}. ${leagueName}\n`;
      });
      response += "\nBalas dengan nomor liga yang dipilih.";
      
      logger.debug(`Sending league selection menu: ${response}`);
      await message.reply(response);
      
      pendingKlasemenResponses.set(groupId, true);
    } else {
      logger.debug(`Processing league selection: ${args[0]}`);
      await handleLeagueSelection(message, args[0]);
    }
  } catch (error) {
    logger.error('Error in klasemenLiga command:', error);
    await message.reply('Terjadi kesalahan saat mengambil data klasemen. Silakan coba lagi nanti.');
  }
}

export async function handleKlasemenResponse(message) {
  const groupId = message.from;
  
  if (pendingKlasemenResponses.get(groupId)) {
    logger.debug(`Handling klasemen response for group: ${groupId}`);
    pendingKlasemenResponses.delete(groupId);
    await handleLeagueSelection(message, message.body);
    return true;
  }
  return false;
}

async function handleLeagueSelection(message, selection) {
  try {
    logger.debug(`Handling league selection: ${selection}`);
    const selectedIndex = parseInt(selection) - 1;
    const leagueNames = Object.keys(LEAGUE_MAPPING);
    
    if (selectedIndex >= 0 && selectedIndex < leagueNames.length) {
      const selectedLeagueName = leagueNames[selectedIndex];
      const selectedLeague = LEAGUE_MAPPING[selectedLeagueName];
      logger.debug(`Selected league: ${selectedLeagueName}, ID: ${selectedLeague.id}`);
      
      const leagueData = await fetchLeagueTable(selectedLeague.id);
      
      if (selectedLeagueName === "World Cup Qualification AFC") {
        await handleWorldCupQualificationAFC(message, leagueData);
      } else {
        const leagueTable = findTableData(leagueData);
        
        if (!leagueTable || !Array.isArray(leagueTable) || leagueTable.length === 0) {
          logger.warn(`No valid table data found for ${selectedLeagueName}`);
          await message.reply("Maaf, data klasemen tidak tersedia untuk liga ini saat ini.");
          return;
        }
        
        const simplifiedTable = leagueTable.map(team => ({
          position: team.idx || team.position || team.rank || '',
          name: team.name || '',
          played: team.played || 0,
          won: team.wins || team.won || 0,
          drawn: team.draws || team.drawn || 0,
          lost: team.losses || team.lost || 0,
          goalsFor: team.scoresFor || team.goalsFor || 0,
          goalsAgainst: team.scoresAgainst || team.goalsAgainst || 0,
          goalDifference: team.goalDifference || 0,
          points: team.pts || team.points || 0
        }));

        // Kirim respons teks
        const textResponse = generateTextResponse(selectedLeagueName, simplifiedTable);
        await message.reply(textResponse);

        // Kirim respons gambar
        const imageBuffer = await generateImageResponse(selectedLeagueName, simplifiedTable);
        const media = new MessageMedia('image/png', imageBuffer.toString('base64'));
        await message.reply(media, null, { caption: `Klasemen ${selectedLeagueName}` });
      }
    } else {
      logger.warn(`Invalid league selection: ${selection}`);
      await message.reply("Pilihan tidak valid. Silakan pilih nomor liga yang tersedia.");
    }
  } catch (error) {
    logger.error('Error in handleLeagueSelection:', error);
    await message.reply('Terjadi kesalahan saat memproses pilihan liga. Silakan coba lagi nanti.');
  }
}

async function handleWorldCupQualificationAFC(message, leagueData) {
  try {
    const groups = ['A', 'B', 'C'];
    let allGroupsData = [];

    for (const group of groups) {
      const groupData = leagueData.tables.find(table => table.title.includes(`Group ${group}`));
      if (groupData && groupData.table) {
        const simplifiedGroupData = groupData.table.map(team => ({
          position: team.idx || team.position || team.rank || '',
          name: team.name || '',
          played: team.played || 0,
          won: team.wins || team.won || 0,
          drawn: team.draws || team.drawn || 0,
          lost: team.losses || team.lost || 0,
          goalsFor: team.scoresFor || team.goalsFor || 0,
          goalsAgainst: team.scoresAgainst || team.goalsAgainst || 0,
          goalDifference: team.goalDifference || 0,
          points: team.pts || team.points || 0
        }));
        allGroupsData.push({ group, data: simplifiedGroupData });
      }
    }

    if (allGroupsData.length === 0) {
      await message.reply("Maaf, data klasemen tidak tersedia untuk Kualifikasi Piala Dunia AFC saat ini.");
      return;
    }

    // Kirim respons teks untuk setiap grup
    for (const groupData of allGroupsData) {
      const textResponse = generateTextResponse(`World Cup Qualification AFC Group ${groupData.group}`, groupData.data);
      await message.reply(textResponse);

      // Kirim respons gambar untuk setiap grup
      const imageBuffer = await generateImageResponse(`World Cup Qualification AFC Group ${groupData.group}`, groupData.data);
      const media = new MessageMedia('image/png', imageBuffer.toString('base64'));
      await message.reply(media, null, { caption: `Klasemen Kualifikasi Piala Dunia AFC Grup ${groupData.group}` });
    }
  } catch (error) {
    logger.error('Error in handleWorldCupQualificationAFC:', error);
    await message.reply('Terjadi kesalahan saat memproses data Kualifikasi Piala Dunia AFC. Silakan coba lagi nanti.');
  }
}

function generateTextResponse(leagueName, table) {
  let response = `*Klasemen ${leagueName}*\n\n`;
  response += "```\n";
  response += "Pos Tim            P  Pts\n";
  response += "--------------------------\n";
  
  table.forEach(team => {
    const position = (team.position + '').padStart(2);
    const name = formatTeamName(team.name, 13);
    const played = (team.played + '').padStart(2);
    const points = (team.points + '').padStart(3);
    
    response += `${position} ${name} ${played} ${points}\n`;
  });
  
  response += "```";
  return response;
}

async function generateImageResponse(leagueName, table) {
  const canvas = createCanvas(800, Math.max(600, 150 + table.length * 30));
  const ctx = canvas.getContext('2d');

  // Set background
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw title
  ctx.fillStyle = '#333333';
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`Klasemen ${leagueName}`, canvas.width / 2, 50);

  // Draw table headers
  const headers = ['Pos', 'Tim', 'Main', 'M', 'S', 'K', 'Poin'];
  const columnWidths = [60, 280, 60, 60, 60, 60, 60];
  let xOffset = 40;

  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'left';
  headers.forEach((header, index) => {
    ctx.fillText(header, xOffset, 100);
    xOffset += columnWidths[index];
  });

  // Draw horizontal line
  ctx.beginPath();
  ctx.moveTo(40, 110);
  ctx.lineTo(canvas.width - 40, 110);
  ctx.strokeStyle = '#999999';
  ctx.stroke();

  // Draw table rows
  ctx.font = '16px Arial';
  table.forEach((team, index) => {
    const y = 140 + index * 30;
    xOffset = 40;

    // Alternating row background
    if (index % 2 === 0) {
      ctx.fillStyle = '#e8e8e8';
      ctx.fillRect(40, y - 20, canvas.width - 80, 30);
    }

    ctx.fillStyle = '#333333';
    ctx.fillText(team.position.toString(), xOffset, y);
    xOffset += columnWidths[0];

    ctx.fillText(formatTeamName(team.name, 30), xOffset, y);
    xOffset += columnWidths[1];

    ctx.fillText(team.played.toString(), xOffset + 20, y);
    xOffset += columnWidths[2];

    ctx.fillText(team.won.toString(), xOffset + 20, y);
    xOffset += columnWidths[3];

    ctx.fillText(team.drawn.toString(), xOffset + 20, y);
    xOffset += columnWidths[4];

    ctx.fillText(team.lost.toString(), xOffset + 20, y);
    xOffset += columnWidths[5];

    ctx.fillText(team.points.toString(), xOffset + 20, y);
  });

  return canvas.toBuffer('image/png');
}