import { createCanvas } from "canvas";
import pkg from "whatsapp-web.js";
const { MessageMedia } = pkg;
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import logger from "./logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TicTacToe {
  constructor() {
    this.games = new Map();
    this.pendingGames = new Map();
  }

  newGame(groupId, player1, player2, isBot = false) {
    this.pendingGames.set(groupId, {
      player1,
      player2,
      confirmed: false,
      isBot,
    });
    return `@${player2.split("@")[0]}, ${
      isBot ? "Bot" : "Anda"
    } diajak bermain Tic Tac Toe oleh @${player1.split("@")[0]}. ${
      isBot
        ? "Bot akan mulai bermain."
        : "Ketik Y untuk menerima atau N untuk menolak dalam 5 menit."
    }`;
  }

  async confirmGame(groupId, player2) {
    const pendingGame = this.pendingGames.get(groupId);
    if (pendingGame && (pendingGame.player2 === player2 || pendingGame.isBot)) {
      const game = {
        board: Array(9).fill(null),
        currentPlayer: "X",
        players: { X: pendingGame.player1, O: player2 },
        lastMoveTime: Date.now(),
        isBot: pendingGame.isBot,
      };
      this.games.set(groupId, game);
      this.pendingGames.delete(groupId);
      return {
        state: await this.getGameState(groupId),
        message: `Permainan dimulai! Giliran @${
          game.players.X.split("@")[0]
        } (X).`,
      };
    }
    return null;
  }

  rejectGame(groupId, player2) {
    const pendingGame = this.pendingGames.get(groupId);
    if (pendingGame && pendingGame.player2 === player2) {
      this.pendingGames.delete(groupId);
      return true;
    }
    return false;
  }

  checkGameEnd(groupId) {
    const game = this.games.get(groupId);
    if (!game) {
      logger.debug(`No active game found for group ${groupId}`);
      return null;
    }

    const winner = this.checkWinner(game.board);
    if (winner) {
      logger.info(`Game ended. Winner: ${winner}`);
      return {
        state: this.getGameState(groupId),
        message: `Permainan berakhir! @${
          game.players[winner].split("@")[0]
        } (${winner}) menang!`,
        winner,
      };
    } else if (!game.board.includes(null)) {
      logger.info(`Game ended in a draw`);
      return {
        state: this.getGameState(groupId),
        message: `Permainan berakhir! Hasil imbang!`,
        winner: "draw",
      };
    }

    logger.debug(`Game continues for group ${groupId}`);
    return null;
  }

  async makeMove(groupId, player, position) {
    const game = this.games.get(groupId);
    if (!game) {
      logger.debug(`No active game found for group ${groupId}`);
      return null;
    }
    if (game.players[game.currentPlayer] !== player) {
      logger.debug(`Not ${player}'s turn`);
      return null;
    }
    if (game.board[position] !== null) {
      logger.debug(`Invalid move: position ${position} is already occupied`);
      return null;
    }

    game.board[position] = game.currentPlayer;
    game.lastMoveTime = Date.now();

    logger.debug(`Move made: Player ${player} at position ${position}`);

    const result = this.checkGameEnd(groupId);
    if (result) {
      logger.info(`Game ended after move`);
      return result;
    }

    game.currentPlayer = game.currentPlayer === "X" ? "O" : "X";
    const nextPlayer =
      game.isBot && game.currentPlayer === "O" ? "bot" : game.currentPlayer;

    logger.debug(`Next player: ${nextPlayer}`);

    return {
      state: await this.getGameState(groupId),
      message: `Giliran @${game.players[game.currentPlayer].split("@")[0]} (${
        game.currentPlayer
      }).`,
      nextPlayer,
    };
  }

  makeBotMove(groupId) {
    const game = this.games.get(groupId);
    if (!game || !game.isBot || game.currentPlayer !== "O") {
      return null;
    }

    const availableMoves = game.board.reduce((acc, cell, index) => {
      if (cell === null) acc.push(index);
      return acc;
    }, []);

    if (availableMoves.length === 0) {
      return null;
    }

    const randomMove =
      availableMoves[Math.floor(Math.random() * availableMoves.length)];
    game.board[randomMove] = "O";
    game.lastMoveTime = Date.now();
    game.currentPlayer = "X";

    return randomMove;
  }

  checkWinner(board) {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8], // Horizontal
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8], // Vertical
      [0, 4, 8],
      [2, 4, 6], // Diagonal
    ];

    for (let line of lines) {
      const [a, b, c] = line;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }

    return null;
  }

  async getGameState(groupId) {
    const game = this.games.get(groupId);
    if (!game) return null;
    return await this.getBoardImage(game.board);
  }

  async getBoardImage(board) {
    const canvas = createCanvas(600, 600);
    const ctx = canvas.getContext("2d");

    // Background
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(0, 0, 600, 600);

    // 3D effect for the board
    ctx.fillStyle = "#d0d0d0";
    ctx.beginPath();
    ctx.moveTo(20, 580);
    ctx.lineTo(40, 560);
    ctx.lineTo(560, 560);
    ctx.lineTo(580, 580);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#e0e0e0";
    ctx.beginPath();
    ctx.moveTo(580, 20);
    ctx.lineTo(560, 40);
    ctx.lineTo(560, 560);
    ctx.lineTo(580, 580);
    ctx.closePath();
    ctx.fill();

    // Main board
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(20, 20, 560, 560);

    // Grid
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 5;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(20 + (i * 560) / 3, 20);
      ctx.lineTo(20 + (i * 560) / 3, 580);
      ctx.moveTo(20, 20 + (i * 560) / 3);
      ctx.lineTo(580, 20 + (i * 560) / 3);
      ctx.stroke();
    }

    // Draw X, O, and numbers
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let i = 0; i < 9; i++) {
      const x = 20 + (((i % 3) + 0.5) * 560) / 3;
      const y = 20 + ((Math.floor(i / 3) + 0.5) * 560) / 3;

      if (board[i] === "X") {
        ctx.strokeStyle = "#ff0000";
        ctx.lineWidth = 15;
        ctx.beginPath();
        ctx.moveTo(x - 60, y - 60);
        ctx.lineTo(x + 60, y + 60);
        ctx.moveTo(x + 60, y - 60);
        ctx.lineTo(x - 60, y + 60);
        ctx.stroke();
      } else if (board[i] === "O") {
        ctx.strokeStyle = "#0000ff";
        ctx.lineWidth = 15;
        ctx.beginPath();
        ctx.arc(x, y, 70, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = "#888888";
        ctx.font = "80px Arial";
        ctx.fillText((i + 1).toString(), x, y);
      }
    }

    const buffer = canvas.toBuffer("image/png");
    const tempFilePath = path.join(
      __dirname,
      "../../temp",
      `board_${Date.now()}.png`
    );
    await fs.writeFile(tempFilePath, buffer);

    const media = MessageMedia.fromFilePath(tempFilePath);

    // Delete the temporary file
    await fs.unlink(tempFilePath);

    return media;
  }

  endGame(groupId) {
    this.games.delete(groupId);
  }

  getPlayerBySymbol(groupId, symbol) {
    const game = this.games.get(groupId);
    return game ? game.players[symbol] : null;
  }

  getPlayerX(groupId) {
    const game = this.games.get(groupId);
    return game ? game.players.X : null;
  }

  getPlayerO(groupId) {
    const game = this.games.get(groupId);
    return game ? game.players.O : null;
  }
}

export default new TicTacToe();
