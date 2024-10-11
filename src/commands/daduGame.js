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

export const handleDaduResponse = async (message) => {
  try {
    const chat = await message.getChat();
    const sender = await message.getContact();
    const gameId = Array.from(activeGames.entries()).find(([id, game]) => 
      game.opponent === sender.id._serialized && game.state === 'waiting_confirmation'
    )?.[0];

    if (!gameId) return false;

    const game = activeGames.get(gameId);

    if (message.body.toLowerCase() === 'y') {
      game.state = 'choosing';
      activeGames.set(gameId, game);

      await chat.sendMessage('Permainan dadu dimulai! Silakan pilih:\n1. Ganjil\n2. Genap', {
        mentions: [await chat.getContactById(game.challenger), await chat.getContactById(game.opponent)]
      });

      // Set timeout for choices
      setTimeout(async () => {
        const currentGame = activeGames.get(gameId);
        if (currentGame && currentGame.state === 'choosing') {
          await handleTimeoutChoices(chat, gameId);
        }
      }, 60 * 1000); // 1 minute

    } else if (message.body.toLowerCase() === 'n') {
      activeGames.delete(gameId);
      await chat.sendMessage('Tantangan ditolak.');
    }

    return true;
  } catch (error) {
    logger.error('Error in handleDaduResponse:', error);
  }
};

export const handleDaduChoice = async (message) => {
  try {
    const chat = await message.getChat();
    const sender = await message.getContact();
    const gameId = Array.from(activeGames.entries()).find(([id, game]) => 
      (game.challenger === sender.id._serialized || game.opponent === sender.id._serialized) && 
      game.state === 'choosing'
    )?.[0];

    if (!gameId) return false;

    const game = activeGames.get(gameId);
    const choice = parseInt(message.body);

    if (choice === 1 || choice === 2) {
      game.choices[sender.id._serialized] = choice === 1 ? 'ganjil' : 'genap';
      activeGames.set(gameId, game);

      if (Object.keys(game.choices).length === 2) {
        await resolveDaduGame(chat, gameId);
      }

      return true;
    }

    return false;
  } catch (error) {
    logger.error('Error in handleDaduChoice:', error);
  }
};

const handleTimeoutChoices = async (chat, gameId) => {
  const game = activeGames.get(gameId);
  const challenger = await chat.getContactById(game.challenger);
  const opponent = await chat.getContactById(game.opponent);

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

const resolveDaduGame = async (chat, gameId) => {
  const game = activeGames.get(gameId);
  const challenger = await chat.getContactById(game.challenger);
  const opponent = await chat.getContactById(game.opponent);

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
  const canvas = createCanvas(200, 100);
  const ctx = canvas.getContext('2d');

  // Function to draw a single die
  const drawDie = (x, y, value) => {
    ctx.fillStyle = 'white';
    ctx.fillRect(x, y, 80, 80);
    ctx.strokeStyle = 'black';
    ctx.strokeRect(x, y, 80, 80);

    ctx.fillStyle = 'black';
    ctx.beginPath();
    
    switch(value) {
      case 1:
        ctx.arc(x + 40, y + 40, 5, 0, Math.PI * 2);
        break;
      case 2:
        ctx.arc(x + 20, y + 20, 5, 0, Math.PI * 2);
        ctx.arc(x + 60, y + 60, 5, 0, Math.PI * 2);
        break;
      case 3:
        ctx.arc(x + 20, y + 20, 5, 0, Math.PI * 2);
        ctx.arc(x + 40, y + 40, 5, 0, Math.PI * 2);
        ctx.arc(x + 60, y + 60, 5, 0, Math.PI * 2);
        break;
      case 4:
        ctx.arc(x + 20, y + 20, 5, 0, Math.PI * 2);
        ctx.arc(x + 60, y + 20, 5, 0, Math.PI * 2);
        ctx.arc(x + 20, y + 60, 5, 0, Math.PI * 2);
        ctx.arc(x + 60, y + 60, 5, 0, Math.PI * 2);
        break;
      case 5:
        ctx.arc(x + 20, y + 20, 5, 0, Math.PI * 2);
        ctx.arc(x + 60, y + 20, 5, 0, Math.PI * 2);
        ctx.arc(x + 40, y + 40, 5, 0, Math.PI * 2);
        ctx.arc(x + 20, y + 60, 5, 0, Math.PI * 2);
        ctx.arc(x + 60, y + 60, 5, 0, Math.PI * 2);
        break;
      case 6:
        ctx.arc(x + 20, y + 20, 5, 0, Math.PI * 2);
        ctx.arc(x + 60, y + 20, 5, 0, Math.PI * 2);
        ctx.arc(x + 20, y + 40, 5, 0, Math.PI * 2);
        ctx.arc(x + 60, y + 40, 5, 0, Math.PI * 2);
        ctx.arc(x + 20, y + 60, 5, 0, Math.PI * 2);
        ctx.arc(x + 60, y + 60, 5, 0, Math.PI * 2);
        break;
    }
    ctx.fill();
  };

  // Draw both dice
  drawDie(10, 10, dice1);
  drawDie(110, 10, dice2);

  return canvas.toBuffer();
};
