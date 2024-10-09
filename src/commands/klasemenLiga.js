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

function formatTeamName(name, maxLength = 20) {
  if (!name) return ''.padEnd(maxLength);
  if (name.length <= maxLength) return name.padEnd(maxLength);
  return name.substring(0, maxLength - 3) + '...';
}

function findTableData(data) {
  if (data.table && Array.isArray(data.table.all)) {
    return data.table.all;
  } else if (data.table && Array.isArray(data.table)) {
    return data.table[0].data;
  } else if (Array.isArray(data.table)) {
    return data.table;
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
  logger.debug(`Handling league selection: ${selection}`);
  const selectedIndex = parseInt(selection) - 1;
  const leagueNames = Object.keys(LEAGUE_MAPPING);
  
  if (selectedIndex >= 0 && selectedIndex < leagueNames.length) {
    const selectedLeagueName = leagueNames[selectedIndex];
    const selectedLeague = LEAGUE_MAPPING[selectedLeagueName];
    logger.debug(`Selected league: ${selectedLeagueName}, ID: ${selectedLeague.id}`);
    
    const leagueData = await fetchLeagueTable(selectedLeague.id);
    
    const leagueTable = findTableData(leagueData);
    
    if (!leagueTable || !Array.isArray(leagueTable)) {
      logger.warn(`No table data found for ${selectedLeagueName}`);
      await message.reply("Maaf, data klasemen tidak tersedia untuk liga ini saat ini.");
      return;
    }
    
    let tableResponse = `Klasemen ${selectedLeagueName}:\n\n`;
    tableResponse += "Pos | Tim                 | M  | M | S | K | GM | GK | SG  | Pts\n";
    tableResponse += "-".repeat(70) + "\n";
    
    leagueTable.forEach(team => {
      const position = (team.idx || team.position || team.rank || '').toString().padStart(3);
      const name = formatTeamName(team.name);
      const played = (team.played || '0').toString().padStart(2);
      const won = (team.wins || team.won || '0').toString().padStart(2);
      const drawn = (team.draws || team.drawn || '0').toString().padStart(2);
      const lost = (team.losses || team.lost || '0').toString().padStart(2);
      const goalsFor = (team.goalsFor || (team.scoresStr ? team.scoresStr.split('-')[0] : '0') || '0').toString().padStart(2);
      const goalsAgainst = (team.goalsAgainst || (team.scoresStr ? team.scoresStr.split('-')[1] : '0') || '0').toString().padStart(2);
      const goalDifference = (team.goalConDiff || team.goalDifference || '0').toString().padStart(3);
      const points = (team.pts || team.points || '0').toString().padStart(3);

      tableResponse += `${position} | ${name} | ${played} | ${won} | ${drawn} | ${lost} | ${goalsFor} | ${goalsAgainst} | ${goalDifference} | ${points}\n`;
    });
    
    logger.debug(`Sending table response for ${selectedLeagueName}`);
    await message.reply(tableResponse);
  } else {
    logger.warn(`Invalid league selection: ${selection}`);
    await message.reply("Pilihan tidak valid. Silakan pilih nomor liga yang tersedia.");
  }
}