import { createCanvas } from 'canvas';
import pkg from 'whatsapp-web.js';
const { MessageMedia } = pkg;

class TicTacToe {
    constructor() {
        this.games = new Map();
        this.pendingGames = new Map();
    }

    newGame(groupId, player1, player2) {
        this.pendingGames.set(groupId, { player1, player2, confirmed: false });
        return `@${player2.split('@')[0]}, Anda diajak bermain Tic Tac Toe oleh @${player1.split('@')[0]}. Ketik Y untuk menerima atau N untuk menolak dalam 5 menit.`;
    }

    confirmGame(groupId, player2) {
        const pendingGame = this.pendingGames.get(groupId);
        if (pendingGame && pendingGame.player2 === player2) {
            const game = {
                board: Array(9).fill(null),
                currentPlayer: 'X',
                players: { X: pendingGame.player1, O: player2 },
                lastMoveTime: Date.now()
            };
            this.games.set(groupId, game);
            this.pendingGames.delete(groupId);
            return this.getBoardImage(game.board);
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

    makeMove(groupId, player, position) {
        const game = this.games.get(groupId);
        if (!game || game.players[game.currentPlayer] !== player || game.board[position] !== null) {
            return null;
        }

        game.board[position] = game.currentPlayer;
        game.lastMoveTime = Date.now();
        const winner = this.checkWinner(game.board);
        
        if (winner || !game.board.includes(null)) {
            const result = this.getBoardImage(game.board);
            this.games.delete(groupId);
            return { result, winner };
        }

        game.currentPlayer = game.currentPlayer === 'X' ? 'O' : 'X';
        return this.getBoardImage(game.board);
    }

    checkWinner(board) {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Horizontal
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Vertical
            [0, 4, 8], [2, 4, 6]             // Diagonal
        ];

        for (let line of lines) {
            const [a, b, c] = line;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return board[a];
            }
        }

        return null;
    }

    getBoardImage(board) {
        const canvas = createCanvas(300, 300);
        const ctx = canvas.getContext('2d');

        // Draw background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 300, 300);

        // Draw grid
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(100, 0);
        ctx.lineTo(100, 300);
        ctx.moveTo(200, 0);
        ctx.lineTo(200, 300);
        ctx.moveTo(0, 100);
        ctx.lineTo(300, 100);
        ctx.moveTo(0, 200);
        ctx.lineTo(300, 200);
        ctx.stroke();

        // Draw X and O
        ctx.font = '80px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let i = 0; i < 9; i++) {
            const x = (i % 3) * 100 + 50;
            const y = Math.floor(i / 3) * 100 + 50;

            if (board[i] === 'X') {
                ctx.fillStyle = '#ff0000';
                ctx.fillText('X', x, y);
            } else if (board[i] === 'O') {
                ctx.fillStyle = '#0000ff';
                ctx.fillText('O', x, y);
            }
        }

        return MessageMedia.fromBuffer(canvas.toBuffer(), 'board.png', 'image/png');
    }

    checkTimeout(groupId) {
        const game = this.games.get(groupId);
        if (game && Date.now() - game.lastMoveTime > 5 * 60 * 1000) {
            const winner = game.currentPlayer === 'X' ? 'O' : 'X';
            this.games.delete(groupId);
            return winner;
        }
        return null;
    }
}

export default new TicTacToe();