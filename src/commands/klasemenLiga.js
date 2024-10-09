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
    logger.debug('Response status:', response.status);
    logger.debug('Response headers:', response.headers);
    logger.debug('Response data:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    logger.error(`Error fetching league table for league ID ${leagueId}:`, error);
    if (error.response) {
      logger.error('Error response:', error.response.data);
      logger.error('Error status:', error.response.status);
      logger.error('Error headers:', error.response.headers);
    }
    throw new Error('Gagal mengambil data klasemen liga.');
  }
}

function formatTeamName(name, maxLength = 20) {
  if (!name) return ''.padEnd(maxLength);
  if (name.length <= maxLength) return name.padEnd(maxLength);
  return name.substring(0, maxLength - 3) + '...';
}

function findTableData(data) {
  logger.debug('Received data structure:', JSON.stringify(data, null, 2));
  
  if (data.leagues && data.leagues[0] && data.leagues[0].table) {
    return data.leagues[0].table;
  } else if (data.table && Array.isArray(data.table)) {
    return data.table;
  } else if (data.table && data.table.all) {
    return data.table.all;
  } else if (data.table && data.table.tables && data.table.tables[0]) {
    return data.table.tables[0];
  } else if (data.details && data.details.table && data.details.table.all) {
    return data.details.table.all;
  }
  
  // Jika tidak ada yang cocok, coba cari array pertama yang mungkin berisi data tim
  for (let key in data) {
    if (Array.isArray(data[key]) && data[key].length > 0 && data[key][0].teamId) {
      return data[key];
    }
  }
  
  logger.warn('Unable to find table data in the response');
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
      logger.debug('Fetched league data:', JSON.stringify(leagueData, null, 2));
      
      const leagueTable = findTableData(leagueData);
      logger.debug('Found league table:', JSON.stringify(leagueTable, null, 2));
      
      if (!leagueTable || !Array.isArray(leagueTable)) {
        logger.warn(`No table data found for ${selectedLeagueName}`);
        await message.reply("Maaf, data klasemen tidak tersedia untuk liga ini saat ini.");
        return;
      }
      
      let tableResponse = `Klasemen ${selectedLeagueName}:\n\n`;
      tableResponse += "Pos | Tim                 | P | M | S | K | GM | GK | SB | Pts\n";
      tableResponse += "-".repeat(70) + "\n";
      
      leagueTable.forEach(team => {
        const position = (team.idx || team.position || team.rank || '').toString().padStart(3);
        const name = formatTeamName(team.name);
        const played = (team.played || team.matchesPlayed || '0').toString().padStart(2);
        const won = (team.wins || team.won || '0').toString().padStart(2);
        const drawn = (team.draws || team.drawn || '0').toString().padStart(2);
        const lost = (team.losses || team.lost || '0').toString().padStart(2);
        const goalsFor = (team.scoresFor || team.goalsFor || '0').toString().padStart(2);
        const goalsAgainst = (team.scoresAgainst || team.goalsAgainst || '0').toString().padStart(2);
        const goalDifference = (team.goalDiff || team.goalDifference || '0').toString().padStart(3);
        const points = (team.pts || team.points || '0').toString().padStart(3);

        tableResponse += `${position} | ${name} | ${played} | ${won} | ${drawn} | ${lost} | ${goalsFor} | ${goalsAgainst} | ${goalDifference} | ${points}\n`;
      });
      
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