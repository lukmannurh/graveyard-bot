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

    await message.reply(inviteMessage, null, { mentions: [player2] });

    if (isBot) {
      // Bot automatically accepts and makes a move
      const gameState = await TicTacToe.confirmGame(
        groupId,
        player2.id._serialized
      );
      if (gameState) {
        await sendGameState(
          message,
          groupId,
          gameState.message,
          gameState.state
        );
        const botMove = TicTacToe.makeBotMove(groupId);
        if (botMove !== null) {
          const result = TicTacToe.checkGameEnd(groupId);
          if (result) {
            await sendGameState(message, groupId, result.message, result.state);
            TicTacToe.endGame(groupId);
          } else {
            const nextState = await TicTacToe.getGameState(groupId);
            await sendGameState(
              message,
              groupId,
              `Bot memilih kotak ${botMove + 1}. Giliran @${
                player1.id.user
              } (X).`,
              nextState
            );
          }
        }
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
      await sendGameState(message, groupId, gameState.message, gameState.state);
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
      logger.debug(`Invalid move: ${message.body}`);
      return false;
    }

    const groupId = message.from;
    const player = await message.getContact();

    logger.debug(`Player ${player.id._serialized} attempting move at position ${position}`);

    const result = await TicTacToe.makeMove(groupId, player.id._serialized, position);
    if (!result) {
      logger.debug(`Invalid move or not player's turn`);
      return false;
    }

    logger.debug(`Move result: ${JSON.stringify(result)}`);

    await sendGameState(message, groupId, result.message, result.state);

    if (result.winner || result.winner === "draw") {
      logger.info(`Game ended. Winner: ${result.winner}`);
      const finalState = await TicTacToe.getGameState(groupId);
      let endMessage;
      if (result.winner === "draw") {
        endMessage = "Permainan berakhir seri!";
      } else {
        const winnerContact = await message.client.getContactById(TicTacToe.getPlayerBySymbol(groupId, result.winner));
        endMessage = `Permainan berakhir! @${winnerContact.id.user} (${result.winner}) menang!`;
      }
      await sendGameState(message, groupId, endMessage, finalState, true);
      TicTacToe.endGame(groupId);
    } else if (result.nextPlayer === "bot") {
      logger.debug("Bot's turn");
      setTimeout(async () => {
        const botMove = TicTacToe.makeBotMove(groupId);
        logger.debug(`Bot move: ${botMove}`);
        if (botMove !== null) {
          const botResult = TicTacToe.checkGameEnd(groupId);
          if (botResult) {
            logger.info(`Game ended after bot move. Result: ${JSON.stringify(botResult)}`);
            const finalState = await TicTacToe.getGameState(groupId);
            let endMessage = botResult.winner === "draw" 
              ? "Permainan berakhir seri!" 
              : `Permainan berakhir! Bot (O) menang!`;
            await sendGameState(message, groupId, endMessage, finalState, true);
            TicTacToe.endGame(groupId);
          } else {
            const nextState = await TicTacToe.getGameState(groupId);
            const playerX = TicTacToe.getPlayerX(groupId);
            await sendGameState(
              message,
              groupId,
              `Bot memilih kotak ${botMove + 1}. Giliran @${playerX.split("@")[0]} (X).`,
              nextState
            );
          }
        }
      }, 1000);
    }

    return true;
  } catch (error) {
    logger.error("Error in makeMove:", error);
    await message.reply("Terjadi kesalahan saat melakukan langkah. Silakan coba lagi.");
  }
};

const sendGameState = async (message, groupId, caption, gameState, isFinal = false) => {
  try {
    const mentions = [];
    const playerX = TicTacToe.getPlayerX(groupId);
    const playerO = TicTacToe.getPlayerO(groupId);
    if (playerX) mentions.push(await message.client.getContactById(playerX));
    if (playerO) mentions.push(await message.client.getContactById(playerO));

    await message.reply(gameState, null, {
      caption: caption,
      mentions: mentions,
    });

    if (isFinal) {
      // Kirim notifikasi tambahan untuk hasil akhir
      const notificationMessage = `🎮 Permainan Tic Tac Toe telah berakhir!\n\n${caption}\n\nTerima kasih telah bermain!`;
      await message.reply(notificationMessage, null, { mentions: mentions });
    }
  } catch (error) {
    logger.error("Error in sendGameState:", error);
    await message.reply("Terjadi kesalahan saat memperbarui status permainan.");
  }
};

export const handleTicTacToeResponse = async (message) => {
  const response = message.body.toLowerCase();
  if (response === "y") {
    await confirmTicTacToe(message);
    return true;
  } else if (response === "n") {
    await rejectTicTacToe(message);
    return true;
  }
  return await makeMove(message);
};
