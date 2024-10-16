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

        const inviteMessage = TicTacToe.newGame(groupId, player1.id._serialized, player2.id._serialized);
        await message.reply(inviteMessage, null, { mentions: [player2] });

        // Set timeout for game confirmation
        setTimeout(async () => {
            if (TicTacToe.pendingGames.has(groupId)) {
                TicTacToe.pendingGames.delete(groupId);
                await message.reply('Game invitation has expired.');
            }
        }, 5 * 60 * 1000);

    } catch (error) {
        logger.error('Error in startTicTacToe:', error);
        await message.reply('An error occurred while starting the game. Please try again.');
    }
};

export const confirmTicTacToe = async (message) => {
    try {
        const groupId = message.from;
        const player2 = await message.getContact();

        const boardImage = TicTacToe.confirmGame(groupId, player2.id._serialized);
        if (boardImage) {
            await message.reply(boardImage, null, { caption: 'Game started! Player X goes first. Use numbers 1-9 to make your move.' });
        } else {
            await message.reply('No pending game invitation found for you.');
        }
    } catch (error) {
        logger.error('Error in confirmTicTacToe:', error);
        await message.reply('An error occurred while confirming the game. Please try again.');
    }
};

export const rejectTicTacToe = async (message) => {
    try {
        const groupId = message.from;
        const player2 = await message.getContact();

        if (TicTacToe.rejectGame(groupId, player2.id._serialized)) {
            await message.reply('Game invitation rejected.');
        } else {
            await message.reply('No pending game invitation found for you.');
        }
    } catch (error) {
        logger.error('Error in rejectTicTacToe:', error);
        await message.reply('An error occurred while rejecting the game. Please try again.');
    }
};

export const makeMove = async (message) => {
    try {
        const position = parseInt(message.body) - 1;
        if (isNaN(position) || position < 0 || position > 8) {
            return false; // Not a valid move, ignore
        }

        const groupId = message.from;
        const player = await message.getContact();

        const result = TicTacToe.makeMove(groupId, player.id._serialized, position);
        if (!result) {
            return false; // Not a valid move or not player's turn, ignore
        }

        if (result.winner) {
            const winnerContact = await message.client.getContactById(result.winner);
            await message.reply(result.result, null, { caption: `Game Over! ${winnerContact.pushname} (${result.winner === 'X' ? 'X' : 'O'}) wins! Congratulations!` });
        } else if (result.winner === null && !result.board.includes(null)) {
            await message.reply(result.result, null, { caption: 'Game Over! It\'s a draw!' });
        } else {
            const game = TicTacToe.games.get(groupId);
            const nextPlayer = await message.client.getContactById(game.players[game.currentPlayer]);
            await message.reply(result, null, { caption: `${nextPlayer.pushname}'s turn (${game.currentPlayer}). Use numbers 1-9 to make your move.` });

            // Set timeout for next move
            setTimeout(async () => {
                const timeoutWinner = TicTacToe.checkTimeout(groupId);
                if (timeoutWinner) {
                    const winnerContact = await message.client.getContactById(game.players[timeoutWinner]);
                    await message.reply(`Game Over! ${winnerContact.pushname} (${timeoutWinner}) wins by timeout! Congratulations!`);
                }
            }, 5 * 60 * 1000);
        }

        return true;
    } catch (error) {
        logger.error('Error in makeMove:', error);
        await message.reply('An error occurred while making the move. Please try again.');
    }
};