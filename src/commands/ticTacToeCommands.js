import TicTacToe from '../utils/ticTacToe.js';
import logger from '../utils/logger.js';

export const startTicTacToe = async (message, args) => {
    try {
        const mentions = await message.getMentions();
        if (mentions.length !== 1) {
            await message.reply('Please mention one player to start the game with.');
            return;
        }

        const player1 = await message.getContact();
        const player2 = mentions[0];
        const groupId = message.from;

        const boardImage = TicTacToe.newGame(groupId, player1.id._serialized, player2.id._serialized);
        await message.reply(boardImage, null, { caption: `Tic Tac Toe game started!\n${player1.pushname} (X) vs ${player2.pushname} (O)\nUse .ttc [1-9] to play.` });
    } catch (error) {
        logger.error('Error in startTicTacToe:', error);
        await message.reply('An error occurred while starting the game. Please try again.');
    }
};

export const makeMove = async (message, args) => {
    try {
        if (args.length !== 1 || !/^[1-9]$/.test(args[0])) {
            await message.reply('Please provide a valid move (1-9).');
            return;
        }

        const position = parseInt(args[0]) - 1;
        const groupId = message.from;
        const player = await message.getContact();

        const result = TicTacToe.makeMove(groupId, player.id._serialized, position);
        if (!result) {
            await message.reply('Invalid move. Please try again.');
            return;
        }

        if (result.winner) {
            const winnerContact = await message.client.getContactById(result.winner);
            await message.reply(result.result, null, { caption: `Game Over! ${winnerContact.pushname} (${result.winner === 'X' ? 'X' : 'O'}) wins!` });
        } else if (result.winner === null && !result.board.includes(null)) {
            await message.reply(result.result, null, { caption: 'Game Over! It\'s a draw!' });
        } else {
            const nextPlayer = await message.client.getContactById(TicTacToe.games.get(groupId).players[TicTacToe.games.get(groupId).currentPlayer]);
            await message.reply(result, null, { caption: `${nextPlayer.pushname}'s turn (${TicTacToe.games.get(groupId).currentPlayer}). Use .ttc [1-9] to play.` });
        }
    } catch (error) {
        logger.error('Error in makeMove:', error);
        await message.reply('An error occurred while making the move. Please try again.');
    }
};