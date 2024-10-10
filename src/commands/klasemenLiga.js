import axios from 'axios';
import logger from '../utils/logger.js';

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
  "Europa League": { id: 73, ccode: "INT" }
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

function formatTeamName(name, maxLength = 15) {
  if (!name) return 'Unknown'.padEnd(maxLength);
  const words = name.split(' ');
  if (words.length === 1) return name.padEnd(maxLength).substring(0, maxLength);
  
  let formattedName = words[0];
  for (let i = 1; i < words.length; i++) {
    if (formattedName.length + 2 >= maxLength) break;
    formattedName += ' ' + words[i][0];
  }
  return formattedName.padEnd(maxLength).substring(0, maxLength);
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
        points: team.pts || team.points || 0
      }));

      let tableResponse = `*Klasemen ${selectedLeagueName}*\n\n`;
      tableResponse += "```\n";
      tableResponse += "Pos Tim            P  Pts\n";
      tableResponse += "--------------------------\n";
      
      simplifiedTable.forEach(team => {
        const position = (team.position + '').padStart(2);
        const name = formatTeamName(team.name, 13);
        const played = (team.played + '').padStart(2);
        const points = (team.points + '').padStart(3);
        
        tableResponse += `${position} ${name} ${played} ${points}\n`;
      });
      
      tableResponse += "```";
      
      logger.debug(`Sending table response for ${selectedLeagueName}`);
      await message.reply(tableResponse);
    } else {
      logger.warn(`Invalid league selection: ${selection}`);
      await message.reply("Pilihan tidak valid. Silakan pilih nomor liga yang tersedia.");
    }
  } catch (error) {
    logger.error('Error in handleLeagueSelection:', error);
    await message.reply('Terjadi kesalahan saat memproses pilihan liga. Silakan coba lagi nanti.');
  }
}