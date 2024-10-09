import axios from 'axios';
import logger from '../utils/logger.js';

const FOTMOB_API_URL = 'https://www.fotmob.com/api/leagues';

const LEAGUE_MAPPING = {
  "Premier League": { id: 47, ccode: "GB1" },
  "LaLiga": { id: 87, ccode: "ES1" },
  "Serie A": { id: 55, ccode: "IT1" },
  "Bundesliga": { id: 54, ccode: "L1" },
  "Ligue 1": { id: 53, ccode: "FR1" },
  "Champions League": { id: 42, ccode: "CL" },
  "Europa League": { id: 73, ccode: "EL" },
  "BRI Liga 1": { id: 403, ccode: "ID1" }
};

const pendingKlasemenResponses = new Map();

async function fetchLeagueTable(leagueId) {
  try {
    logger.info(`Fetching data for league ID ${leagueId}`);
    const response = await axios.get(`${FOTMOB_API_URL}?id=${leagueId}&ccode3=IDN`);
    return response.data;
  } catch (error) {
    logger.error(`Error fetching league table for league ID ${leagueId}:`, error.message);
    throw new Error('Gagal mengambil data klasemen liga.');
  }
}

function formatTeamName(name, maxLength = 14) {
  if (name.length <= maxLength) return name.padEnd(maxLength);
  return name.substring(0, maxLength - 3) + '...';
}

function findLeagueTable(data) {
  if (data && data.table && data.table.all) {
    return data.table.all;
  }
  logger.error('League table structure not found:', JSON.stringify(data, null, 2));
  return null;
}

async function klasemenLiga(message, args) {
  const groupId = message.from;

  try {
    logger.info('klasemenLiga command called');
    if (args.length === 0) {
      let response = "Pilih liga yang ingin dilihat klasemennya:\n\n";
      Object.keys(LEAGUE_MAPPING).forEach((leagueName, index) => {
        response += `${index + 1}. ${leagueName}\n`;
      });
      response += "\nBalas dengan nomor liga yang dipilih.";
      
      await message.reply(response);
      
      pendingKlasemenResponses.set(groupId, true);
    } else {
      await handleLeagueSelection(message, args[0]);
    }
  } catch (error) {
    logger.error('Error in klasemenLiga command:', error.message);
    await message.reply('Terjadi kesalahan saat mengambil data klasemen. Silakan coba lagi nanti.');
  }
}

async function handleKlasemenResponse(message) {
  const groupId = message.from;
  
  if (pendingKlasemenResponses.get(groupId)) {
    pendingKlasemenResponses.delete(groupId);
    await handleLeagueSelection(message, message.body);
    return true;
  }
  return false;
}

async function handleLeagueSelection(message, selection) {
  logger.info(`Handling league selection: ${selection}`);
  const selectedIndex = parseInt(selection) - 1;
  const leagueNames = Object.keys(LEAGUE_MAPPING);
  
  if (selectedIndex >= 0 && selectedIndex < leagueNames.length) {
    const selectedLeagueName = leagueNames[selectedIndex];
    const selectedLeague = LEAGUE_MAPPING[selectedLeagueName];
    
    try {
      const leagueData = await fetchLeagueTable(selectedLeague.id);
      logger.info('League data received');
      logger.debug('League data structure:', JSON.stringify(leagueData, null, 2));
      
      const leagueTable = findLeagueTable(leagueData);
      
      if (!leagueTable || !Array.isArray(leagueTable)) {
        logger.error('No valid league table data found');
        await message.reply("Maaf, data klasemen terbaru tidak tersedia untuk liga ini saat ini.");
        return;
      }

      let tableResponse = `Klasemen ${selectedLeagueName}:\n\n`;
      tableResponse += "Pos Tim            M  M  S  K  GD  Pts\n";
      tableResponse += "---------------------------------------\n";
      
      leagueTable.forEach(team => {
        tableResponse += `${team.idx.toString().padStart(2)} `;
        tableResponse += `${formatTeamName(team.name)} `;
        tableResponse += `${team.played.toString().padStart(2)} `;
        tableResponse += `${team.wins.toString().padStart(2)} `;
        tableResponse += `${team.draws.toString().padStart(2)} `;
        tableResponse += `${team.losses.toString().padStart(2)} `;
        tableResponse += `${team.goalConDiff.toString().padStart(3)} `;
        tableResponse += `${team.pts.toString().padStart(3)}\n`;
      });
      
      logger.info('Sending league table response');
      await message.reply(tableResponse);
    } catch (error) {
      logger.error('Error fetching league data:', error.message);
      await message.reply('Terjadi kesalahan saat mengambil data klasemen. Silakan coba lagi nanti.');
    }
  } else {
    await message.reply("Pilihan tidak valid. Silakan pilih nomor liga yang tersedia.");
  }
}

export { klasemenLiga, handleKlasemenResponse };