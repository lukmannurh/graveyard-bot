import { createCanvas } from "canvas";
import pkg from "whatsapp-web.js";
const { MessageMedia } = pkg;
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

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
      return await this.getGameState(groupId);
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

  async makeMove(groupId, player, position) {
    const game = this.games.get(groupId);
    if (
      !game ||
      game.players[game.currentPlayer] !== player ||
      game.board[position] !== null
    ) {
      return null;
    }

    game.board[position] = game.currentPlayer;
    game.lastMoveTime = Date.now();

    const winner = this.checkWinner(game.board);
    if (winner || !game.board.includes(null)) {
      return { winner, board: game.board };
    }

    game.currentPlayer = game.currentPlayer === "X" ? "O" : "X";
    return {
      nextPlayer:
        game.isBot && game.currentPlayer === "O" ? "bot" : game.currentPlayer,
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

  checkGameEnd(groupId) {
    const game = this.games.get(groupId);
    if (!game) return null;

    const winner = this.checkWinner(game.board);
    if (winner || !game.board.includes(null)) {
      return { winner, board: game.board };
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

    // Draw background
    const gradient = ctx.createLinearGradient(0, 0, 600, 600);
    gradient.addColorStop(0, "#4e54c8");
    gradient.addColorStop(1, "#8f94fb");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 600);

    // Draw 3D grid
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 10;
    ctx.lineCap = "round";

    // Vertical lines
    this.draw3DLine(ctx, 200, 50, 200, 550);
    this.draw3DLine(ctx, 400, 50, 400, 550);

    // Horizontal lines
    this.draw3DLine(ctx, 50, 200, 550, 200);
    this.draw3DLine(ctx, 50, 400, 550, 400);

    // Draw X and O
    ctx.lineWidth = 15;
    for (let i = 0; i < 9; i++) {
      const x = (i % 3) * 200 + 100;
      const y = Math.floor(i / 3) * 200 + 100;

      if (board[i] === "X") {
        this.draw3DX(ctx, x, y);
      } else if (board[i] === "O") {
        this.draw3DO(ctx, x, y);
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

  draw3DLine(ctx, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctx.beginPath();
    ctx.moveTo(x1 + 5, y1 + 5);
    ctx.lineTo(x2 + 5, y2 + 5);
    ctx.stroke();
  }

  draw3DX(ctx, x, y) {
    ctx.strokeStyle = "#ff6b6b";
    this.draw3DLine(ctx, x - 60, y - 60, x + 60, y + 60);
    this.draw3DLine(ctx, x + 60, y - 60, x - 60, y + 60);
  }

  draw3DO(ctx, x, y) {
    ctx.strokeStyle = "#4ecdc4";
    ctx.beginPath();
    ctx.arc(x, y, 60, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(78, 205, 196, 0.5)";
    ctx.beginPath();
    ctx.arc(x + 5, y + 5, 60, 0, Math.PI * 2);
    ctx.stroke();
  }

  getPlayerX(groupId) {
    const game = this.games.get(groupId);
    return game ? game.players.X.split("@")[0] : null;
  }

  getPlayerO(groupId) {
    const game = this.games.get(groupId);
    return game ? game.players.O.split("@")[0] : null;
  }

  endGame(groupId) {
    this.games.delete(groupId);
  }
}

export default new TicTacToe();
