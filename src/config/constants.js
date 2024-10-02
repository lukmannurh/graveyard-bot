export const PORT = process.env.PORT || 5000;
export const NODE_ENV = process.env.NODE_ENV || 'production';
export const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
export const API_KEY = process.env.API_KEY;
export const OWNER_NUMBER = process.env.OWNER_NUMBER;
export const PREFIX = '.';
export const ADMIN_COMMANDS = ['end', 'kick', 'tagall', 'tambah', 'ban', 'unban'];
export const OWNER_COMMANDS = ['authorize'];
export const GENERAL_COMMANDS = [
    'menu', 'ai', 'start', 'tebak', 'list', 'random', 'waifu', 
    'bandarsabu', 'cekjomok', 'adventure', 'getpp', 'stats', 'jadwalsholat'
  ];
export const WAIFU_API_TOKEN = process.env.WAIFU_API_TOKEN;

export const PUPPETEER_ARGS = ['--no-sandbox', '--disable-setuid-sandbox'];