require('dotenv').config();
const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const messageHandler = require('./src/handlers/messageHandler');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = 5000;

const whatsappClient = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
});

whatsappClient.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('QR Code received, scan with your phone.');
});

whatsappClient.on('ready', () => {
    console.log('WhatsApp Web client is ready!');
    setWhatsAppClient(whatsappClient);
});

whatsappClient.on('message', messageHandler);

whatsappClient.initialize();

app.listen(port, () => console.log(`Express app running on port ${port}!`));