import axios from 'axios';
import logger from './logger'

const TIMEZONE_MAPPING = {
  'WIB': 'Asia/Jakarta',
  'WITA': 'Asia/Makassar',
  'WIT': 'Asia/Jayapura'
};

const CITY_MAPPING = {
  'WIB': 'Jakarta',
  'WITA': 'Makassar',
  'WIT': 'Jayapura'
};

async function getPrayerTimes(timezone) {
  const date = new Date();
  const formattedDate = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
  
  try {
    const response = await axios.get(`http://api.aladhan.com/v1/timingsByCity/${formattedDate}`, {
      params: {
        city: CITY_MAPPING[timezone],
        country: 'Indonesia',
        method: 2  // Islamic Society of North America (ISNA) calculation method
      }
    });

    const timings = response.data.data.timings;
    return {
      Subuh: timings.Fajr,
      Dzuhur: timings.Dhuhr,
      Ashar: timings.Asr,
      Maghrib: timings.Maghrib,
      Isya: timings.Isha
    };
  } catch (error) {
    logger.error('Error fetching prayer times:', error);
    throw new Error('Gagal mendapatkan jadwal sholat. Silakan coba lagi nanti.');
  }
}

export async function getAllPrayerTimes() {
  const results = {};
  for (const timezone of Object.keys(TIMEZONE_MAPPING)) {
    results[timezone] = await getPrayerTimes(timezone);
  }
  return results;
}

export function getCurrentDate() {
  const now = new Date();
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  const day = days[now.getDay()];
  const date = now.getDate();
  const month = months[now.getMonth()];
  const year = now.getFullYear();

  return `${day}, ${date} ${month} ${year}`;
}