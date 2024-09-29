import dotenv from 'dotenv-safe';
import dotenvSafe from 'dotenv-safe';
import path from 'path';

dotenvSafe.config({
  example: path.resolve(__dirname, '../../.env.example'),
});

dotenv.config();

export const PORT = process.env.PORT || 5000;
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
export const API_KEY = process.env.API_KEY;
export const OWNER_NUMBER = process.env.OWNER_NUMBER;

export const PREFIX = '.';
export const ADMIN_COMMANDS = ['end', 'kick', 'tagall', 'tambah', 'ban', 'unban', 'timeout'];
export const OWNER_COMMANDS = ['authorize'];

export const PUPPETEER_ARGS = ['--no-sandbox', '--disable-setuid-sandbox'];