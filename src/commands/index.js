const menu = require('./menu');
const start = require('./start');
const tebak = require('./tebak');
const end = require('./end');
const list = require('./list');
const kick = require('./kick');
const tagall = require('./tagall');
const ai = require('./ai');
const authorizeGroup = require('./authorizeGroup');
const random = require('./random');
const tambah = require('./tambah');  // Tambahkan ini

const ADMIN_COMMANDS = ['end', 'kick', 'tagall', 'tambah'];  // Tambahkan 'tambah' ke daftar perintah admin
const OWNER_COMMANDS = ['authorize'];

module.exports = {
    menu,
    start,
    tebak,
    end,
    list,
    kick,
    tagall,
    ai,
    authorize: authorizeGroup,
    random,
    tambah,  // Tambahkan ini
    ADMIN_COMMANDS,
    OWNER_COMMANDS
};