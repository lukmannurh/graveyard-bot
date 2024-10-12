import pkg from 'whatsapp-web.js';
const { MessageMedia } = pkg;
import { createCanvas } from 'canvas';
import logger from '../utils/logger.js';

const activeGames = new Map();

export const dadu = async (message, args) => {
  try {
    const chat = await message.getChat();
    const mentions = await message.getMentions();

    if (mentions.length !== 1) {
      await message.reply('Silakan tag satu peserta untuk bermain dadu. Contoh: .dadu @peserta');
      return;
    }

    const challenger = await message.getContact();
    const opponent = mentions[0];

    const gameId = `${chat.id._serialized}_${Date.now()}`;
    const game = {
      challenger: challenger.id._serialized,
      opponent: opponent.id._serialized,
      state: 'waiting_confirmation',
      choices: {},
    };

    activeGames.set(gameId, game);
    logger.debug(`New game created with ID: ${gameId}`);

    await chat.sendMessage(`@${opponent.number} Anda ditantang bermain dadu oleh @${challenger.number}. Ketik Y untuk menerima atau N untuk menolak.`, {
      mentions: [opponent, challenger]
    });

    // Set timeout for opponent response
    setTimeout(async () => {
      const currentGame = activeGames.get(gameId);
      if (currentGame && currentGame.state === 'waiting_confirmation') {
        activeGames.delete(gameId);
        await chat.sendMessage('Tantangan dibatalkan karena tidak ada respon.');
      }
    }, 5 * 60 * 1000); // 5 minutes

  } catch (error) {
    logger.error('Error in dadu command:', error);
    await message.reply('Terjadi kesalahan saat memulai permainan dadu.');
  }
};

const handleDaduResponse = async (message) => {
  try {
    const chat = await message.getChat();
    const sender = await message.getContact();
    const gameId = Array.from(activeGames.entries()).find(([id, game]) => 
      game.opponent === sender.id._serialized && game.state === 'waiting_confirmation'
    )?.[0];

    logger.debug(`Checking dadu response for gameId: ${gameId}`);

    if (!gameId) {
      logger.debug('No active game found for this response');
      return false;
    }

    const game = activeGames.get(gameId);
    const response = message.body.toLowerCase();

    logger.debug(`Received response: ${response} for gameId: ${gameId}`);

    if (response === 'y') {
      game.state = 'choosing';
      activeGames.set(gameId, game);

      const challenger = await message.client.getContactById(game.challenger);
      const opponent = await message.client.getContactById(game.opponent);

      await chat.sendMessage('Permainan dadu dimulai! Silakan pilih:\n1. Ganjil\n2. Genap', {
        mentions: [challenger, opponent]
      });

      // Set timeout for choices
      setTimeout(async () => {
        const currentGame = activeGames.get(gameId);
        if (currentGame && currentGame.state === 'choosing') {
          await handleTimeoutChoices(message.client, chat, gameId);
        }
      }, 60 * 1000); // 1 minute

      logger.debug('Game started successfully');
    } else if (response === 'n') {
      activeGames.delete(gameId);
      await chat.sendMessage('Tantangan ditolak.');
      logger.debug('Challenge declined');
    } else {
      logger.debug('Invalid response received');
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error in handleDaduResponse:', error);
    return false;
  }
};

const handleDaduChoice = async (message) => {
  try {
    const chat = await message.getChat();
    const sender = await message.getContact();
    const gameId = Array.from(activeGames.entries()).find(([id, game]) => 
      (game.challenger === sender.id._serialized || game.opponent === sender.id._serialized) && 
      game.state === 'choosing'
    )?.[0];

    if (!gameId) {
      logger.debug('No active game found for this choice');
      return false;
    }

    const game = activeGames.get(gameId);
    const choice = parseInt(message.body);

    if (choice === 1 || choice === 2) {
      game.choices[sender.id._serialized] = choice === 1 ? 'ganjil' : 'genap';
      activeGames.set(gameId, game);

      logger.debug(`Player ${sender.id._serialized} chose ${game.choices[sender.id._serialized]}`);

      if (Object.keys(game.choices).length === 2) {
        await resolveDaduGame(message.client, chat, gameId);
      } else {
        await chat.sendMessage(`${sender.pushname} telah memilih. Menunggu pemain lain...`);
      }

      return true;
    }

    return false;
  } catch (error) {
    logger.error('Error in handleDaduChoice:', error);
    return false;
  }
};

const handleTimeoutChoices = async (client, chat, gameId) => {
  const game = activeGames.get(gameId);
  if (!game) return;

  const challenger = await client.getContactById(game.challenger);
  const opponent = await client.getContactById(game.opponent);

  if (!game.choices[game.challenger] && !game.choices[game.opponent]) {
    await chat.sendMessage('Kedua pemain tidak memberi respon. Permainan dibatalkan.');
  } else if (!game.choices[game.challenger]) {
    await chat.sendMessage(`@${challenger.number} tidak memberi respon. @${opponent.number} menang!`, {
      mentions: [challenger, opponent]
    });
  } else if (!game.choices[game.opponent]) {
    await chat.sendMessage(`@${opponent.number} tidak memberi respon. @${challenger.number} menang!`, {
      mentions: [challenger, opponent]
    });
  }

  activeGames.delete(gameId);
};

const resolveDaduGame = async (client, chat, gameId) => {
  const game = activeGames.get(gameId);
  if (!game) return;

  const challenger = await client.getContactById(game.challenger);
  const opponent = await client.getContactById(game.opponent);

  const diceRoll1 = Math.floor(Math.random() * 6) + 1;
  const diceRoll2 = Math.floor(Math.random() * 6) + 1;
  const total = diceRoll1 + diceRoll2;
  const result = total % 2 === 0 ? 'genap' : 'ganjil';

  // Generate dice image
  const diceImage = await generateDiceImage(diceRoll1, diceRoll2);
  const media = new MessageMedia('image/png', diceImage.toString('base64'));

  await chat.sendMessage(media, { 
    caption: `Dadu menunjukkan: ${diceRoll1} dan ${diceRoll2}. Total: ${total} (${result.toUpperCase()})`
  });

  let winnerMessage = '';
  if (game.choices[game.challenger] === game.choices[game.opponent]) {
    if (game.choices[game.challenger] === result) {
      winnerMessage = 'Permainan berakhir seri!';
    } else {
      winnerMessage = 'Kedua pemain salah tebak. Tidak ada pemenang!';
    }
  } else if (game.choices[game.challenger] === result) {
    winnerMessage = `Selamat @${challenger.number}, Anda menang!`;
  } else if (game.choices[game.opponent] === result) {
    winnerMessage = `Selamat @${opponent.number}, Anda menang!`;
  }

  await chat.sendMessage(winnerMessage, {
    mentions: [challenger, opponent]
  });

  activeGames.delete(gameId);
};

const generateDiceImage = async (dice1, dice2) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 300;
  canvas.height = 150;
  
  // Fungsi untuk menggambar dadu
  function drawDie(x, y, size, value) {
    // Gambar kubus dasar
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, size, size);
    ctx.strokeRect(x, y, size, size);
  
    // Gambar titik-titik
    ctx.fillStyle = '#000000';
    const dotSize = size / 10;
    const padding = size / 5;
  
    const positions = [
      [[1,1]], // 1
      [[0,0],[2,2]], // 2
      [[0,0],[1,1],[2,2]], // 3
      [[0,0],[0,2],[2,0],[2,2]], // 4
      [[0,0],[0,2],[1,1],[2,0],[2,2]], // 5
      [[0,0],[0,2],[1,0],[1,2],[2,0],[2,2]] // 6
    ];
  
    positions[value - 1].forEach(([dx, dy]) => {
      ctx.beginPath();
      ctx.arc(
        x + padding + dx * padding,
        y + padding + dy * padding,
        dotSize,
        0,
        Math.PI * 2
      );
      ctx.fill();
    });
  
    // Efek 3D sederhana
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(x + size, y, size / 10, size);
    ctx.fillRect(x, y + size, size, size / 10);
  }
  
  // Fungsi animasi
  function animate() {
    let frame = 0;
    const totalFrames = 20;
    const die1Value = Math.floor(Math.random() * 6) + 1;
    const die2Value = Math.floor(Math.random() * 6) + 1;
  
    function drawFrame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const rotation = (frame / totalFrames) * Math.PI * 2;
      const scale = 0.8 + Math.sin(rotation) * 0.2;
      
      ctx.save();
      ctx.translate(75, 75);
      ctx.scale(scale, scale);
      ctx.rotate(rotation);
      ctx.translate(-50, -50);
      drawDie(0, 0, 100, die1Value);
      ctx.restore();
  
      ctx.save();
      ctx.translate(225, 75);
      ctx.scale(scale, scale);
      ctx.rotate(-rotation);
      ctx.translate(-50, -50);
      drawDie(0, 0, 100, die2Value);
      ctx.restore();
  
      frame++;
      if (frame < totalFrames) {
        requestAnimationFrame(drawFrame);
      }
    }
  
    drawFrame();
  }
  
  // Mulai animasi
  animate();
  
  // Menambahkan canvas ke DOM
  document.body.appendChild(canvas);
  
  // Tombol untuk melempar dadu lagi
  const rollButton = document.createElement('button');
  rollButton.textContent = 'Roll Dice';
  rollButton.onclick = animate;
  document.body.appendChild(rollButton);
};

export const handleDaduGame = async (message) => {
  try {
    logger.debug(`Handling dadu game response: ${message.body}`);
    if (await handleDaduResponse(message)) {
      logger.debug('Dadu response handled successfully');
      return true;
    }
    if (await handleDaduChoice(message)) {
      logger.debug('Dadu choice handled successfully');
      return true;
    }
    logger.debug('Message not related to dadu game');
    return false;
  } catch (error) {
    logger.error('Error in handleDaduGame:', error);
    return false;
  }
};