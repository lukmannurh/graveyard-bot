import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({
  path: resolve(__dirname, '../../.env')
});

console.log('OWNER_NUMBER loaded from env:', process.env.OWNER_NUMBER);

export const PORT = process.env.PORT || 5000;
export const NODE_ENV = process.env.NODE_ENV || 'production';
export const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
export const API_KEY = process.env.API_KEY;
export const OWNER_NUMBER = process.env.OWNER_NUMBER;
export const PREFIX = '.';
export const ADMIN_COMMANDS = ['end', 'kick', 'tagall', 'ban', 'unban'];
export const OWNER_COMMANDS = ['authorize'];
export const WAIFU_API_TOKEN = process.env.WAIFU_API_TOKEN;

export const PUPPETEER_ARGS = ['--no-sandbox', '--disable-setuid-sandbox'];