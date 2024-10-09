import axios from 'axios';
import cheerio from 'cheerio';
import logger from '../utils/logger.js';

const FOTMOB_URL = 'https://www.fotmob.com';

const LEAGUE_MAPPING = {
  "Premier League": "/leagues/47/overview/premier-league",
  "LaLiga": "/leagues/87/overview/laliga",
  "Serie A": "/leagues/55/overview/serie-a",
  "Bundesliga": "/leagues/54/overview/bundesliga",
  "Ligue 1": "/leagues/53/overview/ligue-1",
  "Champions League": "/leagues/42/overview/champions-league",
  "Europa League": "/leagues/73/overview/europa-league",
  "BRI Liga 1": "/leagues/403/overview/bri-liga-1"
};

const pendingKlasemenResponses = new Map();

async function scrapeLeagueTable(leagueUrl) {
  try {
    logger.info(`Scraping data from ${FOTMOB_URL}${leagueUrl}`);
    const response = await axios.get(`${FOTMOB_URL}${leagueUrl}`);
    const $ = cheerio.load(response.data);
    
    const table = [];
    $('table.Table__table tbody tr').each((index, element) => {
      const $tds = $(element).find('td');
      table.push({
        position: $($tds[0]).text().trim(),
        name: $($tds[1]).text().trim(),
        played: $($tds[2]).text().trim(),
        won: $($tds[3]).text().trim(),
        drawn: $($tds[4]).text().trim(),
        lost: $($tds[5]).text().trim(),
        goalDifference: $($tds[6]).text().trim(),
        points: $($tds[7]).text().trim()
      });
    });

    logger.info(`Scraped ${table.length} teams from the league table`);
    return table;
  } catch (error) {
    logger.error(`Error scraping league table: ${error.message}`);
    throw new Error('Gagal mengambil data klasemen liga.');
  }
}

function formatTeamName(name, maxLength = 14) {
  if (name.length <= maxLength) return name.padEnd(maxLength);
  return name.substring(0, maxLength - 3) + '...';
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
    const selectedLeagueUrl = LEAGUE_MAPPING[selectedLeagueName];
    
    try {
      const leagueTable = await scrapeLeagueTable(selectedLeagueUrl);
      
      if (!leagueTable || leagueTable.length === 0) {
        logger.error('No valid league table data found');
        await message.reply("Maaf, data klasemen terbaru tidak tersedia untuk liga ini saat ini.");
        return;
      }

      let tableResponse = `Klasemen ${selectedLeagueName}:\n\n`;
      tableResponse += "Pos Tim            M  M  S  K  GD  Pts\n";
      tableResponse += "---------------------------------------\n";
      
      leagueTable.forEach(team => {
        tableResponse += `${team.position.padStart(2)} `;
        tableResponse += `${formatTeamName(team.name)} `;
        tableResponse += `${team.played.padStart(2)} `;
        tableResponse += `${team.won.padStart(2)} `;
        tableResponse += `${team.drawn.padStart(2)} `;
        tableResponse += `${team.lost.padStart(2)} `;
        tableResponse += `${team.goalDifference.padStart(3)} `;
        tableResponse += `${team.points.padStart(3)}\n`;
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