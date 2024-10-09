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
    const response = await axios.get(`${FOTMOB_API_URL}?id=${leagueId}`);
    logger.debug(`API Response for league ${leagueId}:`, JSON.stringify(response.data, null, 2));
    return response.data.table;
  } catch (error) {
    logger.error(`Error fetching league table for league ID ${leagueId}:`, error);
    throw new Error('Gagal mengambil data klasemen liga.');
  }
}

function formatTeamName(name, maxLength = 14) {
  if (name.length <= maxLength) return name.padEnd(maxLength);
  return name.substring(0, maxLength - 3) + '...';
}

export async function klasemenLiga(message, args) {
  const groupId = message.from;

  try {
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
    logger.error('Error in klasemenLiga command:', error);
    await message.reply('Terjadi kesalahan saat mengambil data klasemen. Silakan coba lagi nanti.');
  }
}

export async function handleKlasemenResponse(message) {
  const groupId = message.from;
  
  if (pendingKlasemenResponses.get(groupId)) {
    pendingKlasemenResponses.delete(groupId);
    await handleLeagueSelection(message, message.body);
    return true;
  }
  return false;
}

async function handleLeagueSelection(message, selection) {
  const selectedIndex = parseInt(selection) - 1;
  const leagueNames = Object.keys(LEAGUE_MAPPING);
  
  if (selectedIndex >= 0 && selectedIndex < leagueNames.length) {
    const selectedLeagueName = leagueNames[selectedIndex];
    const selectedLeague = LEAGUE_MAPPING[selectedLeagueName];
    const leagueData = await fetchLeagueTable(selectedLeague.id);
    
    logger.debug(`League data for ${selectedLeagueName}:`, JSON.stringify(leagueData, null, 2));

    if (!Array.isArray(leagueData) || leagueData.length === 0) {
      await message.reply("Maaf, data klasemen tidak tersedia untuk liga ini saat ini.");
      return;
    }

    const leagueTable = leagueData[0].data;
    
    logger.debug(`League table for ${selectedLeagueName}:`, JSON.stringify(leagueTable, null, 2));

    if (!Array.isArray(leagueTable)) {
      await message.reply("Maaf, format data klasemen tidak sesuai. Silakan coba lagi nanti.");
      return;
    }
    
    let tableResponse = `Klasemen ${selectedLeagueName}:\n\n`;
    tableResponse += "Pos Tim            M  M  S  K  Pts\n";
    tableResponse += "--------------------------------\n";
    
    leagueTable.forEach(team => {
      tableResponse += `${team.idx.toString().padStart(2)} `;
      tableResponse += `${formatTeamName(team.name)} `;
      tableResponse += `${team.played.toString().padStart(2)} `;
      tableResponse += `${team.wins.toString().padStart(2)} `;
      tableResponse += `${team.draws.toString().padStart(2)} `;
      tableResponse += `${team.losses.toString().padStart(2)} `;
      tableResponse += `${team.pts.toString().padStart(3)}\n`;
    });
    
    await message.reply(tableResponse);
  } else {
    await message.reply("Pilihan tidak valid. Silakan pilih nomor liga yang tersedia.");
  }
}