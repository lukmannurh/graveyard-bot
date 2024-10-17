import TicTacToe from "../utils/ticTacToe.js";
import logger from "../utils/logger.js";

export const startTicTacToe = async (message, args) => {
  try {
    const mentions = await message.getMentions();
    if (mentions.length !== 1) {
      await message.reply(
        "Please mention one player or @bot to start the game with."
      );
      return;
    }

    const player1 = await message.getContact();
    const player2 = mentions[0];
    const groupId = message.from;

    // Check if player2 is a bot
    const isBot = player2.id.user === "status@broadcast";

    const inviteMessage = TicTacToe.newGame(
      groupId,
      player1.id._serialized,
      player2.id._serialized,
      isBot
    );
    await message.reply(inviteMessage, null, {
      mentions: [player2.id._serialized],
    });

    if (isBot) {
      // Bot automatically accepts and makes a move
      await TicTacToe.confirmGame(groupId, player2.id._serialized);
      const botMove = TicTacToe.makeBotMove(groupId);
      if (botMove !== null) {
        await sendGameState(
          message,
          groupId,
          `Bot memilih kotak ${botMove + 1}`
        );
      }
    } else {
      // Set timeout for game confirmation
      setTimeout(async () => {
        if (TicTacToe.pendingGames.has(groupId)) {
          TicTacToe.pendingGames.delete(groupId);
          await message.reply("Game invitation has expired.");
        }
      }, 5 * 60 * 1000);
    }
  } catch (error) {
    logger.error("Error in startTicTacToe:", error);
    await message.reply(
      "An error occurred while starting the game. Please try again."
    );
  }
};

export const confirmTicTacToe = async (message) => {
  try {
    const groupId = message.from;
    const player2 = await message.getContact();

    const gameState = await TicTacToe.confirmGame(
      groupId,
      player2.id._serialized
    );
    if (gameState) {
      await sendGameState(
        message,
        groupId,
        "Game started! Player X goes first."
      );
    } else {
      await message.reply("No pending game invitation found for you.");
    }
  } catch (error) {
    logger.error("Error in confirmTicTacToe:", error);
    await message.reply(
      "An error occurred while confirming the game. Please try again."
    );
  }
};

export const rejectTicTacToe = async (message) => {
  try {
    const groupId = message.from;
    const player2 = await message.getContact();

    if (TicTacToe.rejectGame(groupId, player2.id._serialized)) {
      await message.reply("Game invitation rejected.");
    } else {
      await message.reply("No pending game invitation found for you.");
    }
  } catch (error) {
    logger.error("Error in rejectTicTacToe:", error);
    await message.reply(
      "An error occurred while rejecting the game. Please try again."
    );
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

    const result = await TicTacToe.makeMove(
      groupId,
      player.id._serialized,
      position
    );
    if (!result) {
      return false; // Not a valid move or not player's turn, ignore
    }

    await sendGameState(
      message,
      groupId,
      `@${player.id.user} memilih kotak ${position + 1}`
    );

    if (result.winner || (result.board && !result.board.includes(null))) {
      // Game ended
      let endMessage = result.winner
        ? `Game Over! @${
            result.winner === "X"
              ? TicTacToe.getPlayerX(groupId)
              : TicTacToe.getPlayerO(groupId)
          } wins!`
        : "Game Over! It's a draw!";
      await message.reply(endMessage, null, {
        mentions: [
          TicTacToe.getPlayerX(groupId),
          TicTacToe.getPlayerO(groupId),
        ],
      });
      TicTacToe.endGame(groupId);
    } else if (result.nextPlayer === "bot") {
      // Bot's turn
      setTimeout(async () => {
        const botMove = TicTacToe.makeBotMove(groupId);
        if (botMove !== null) {
          await sendGameState(
            message,
            groupId,
            `Bot memilih kotak ${botMove + 1}`
          );
          const finalResult = TicTacToe.checkGameEnd(groupId);
          if (finalResult) {
            let endMessage = finalResult.winner
              ? `Game Over! @${
                  finalResult.winner === "X"
                    ? TicTacToe.getPlayerX(groupId)
                    : TicTacToe.getPlayerO(groupId)
                } wins!`
              : "Game Over! It's a draw!";
            await message.reply(endMessage, null, {
              mentions: [
                TicTacToe.getPlayerX(groupId),
                TicTacToe.getPlayerO(groupId),
              ],
            });
            TicTacToe.endGame(groupId);
          }
        }
      }, 1000); // Delay bot's move by 1 second
    } else {
      // Notify next player
      const nextPlayer =
        result.nextPlayer === "X"
          ? TicTacToe.getPlayerX(groupId)
          : TicTacToe.getPlayerO(groupId);
      await message.reply(`It's @${nextPlayer}'s turn!`, null, {
        mentions: [nextPlayer],
      });
    }

    return true;
  } catch (error) {
    logger.error("Error in makeMove:", error);
    await message.reply(
      "An error occurred while making the move. Please try again."
    );
  }
};

const sendGameState = async (message, groupId, caption) => {
  const gameState = await TicTacToe.getGameState(groupId);
  if (gameState) {
    await message.reply(gameState, null, { caption: caption });
  }
};

// Tambahkan fungsi ini untuk menangani respons Tic Tac Toe
export const handleTicTacToeResponse = async (message) => {
  const body = message.body.toLowerCase();
  if (body === "y") {
    return await confirmTicTacToe(message);
  } else if (body === "n") {
    return await rejectTicTacToe(message);
  } else if (/^[1-9]$/.test(body)) {
    return await makeMove(message);
  }
  return false;
};
