import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { ChessGame } from './game';
import { Position, Move, ArmyType } from './types';

const app = express();
app.use(cors());

const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"], // Vite default port
    methods: ["GET", "POST"]
  }
});

// In the future, use a Room Manager to handle multiple games
let game = new ChessGame('western', 'empire');

// Socket Event Handlers
io.on('connection', (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // Send initial handshake and current game state
  socket.emit('server_status', { status: 'online', timestamp: Date.now() });
  socket.emit('game_state', game.getGameState());

  // Handle: Request Legal Moves
  socket.on('get_legal_moves', (pos: Position) => {
    try {
      const moves = game.getLegalMoves(pos.r, pos.c);
      socket.emit('legal_moves', { from: pos, moves });
    } catch (e) {
      console.error('Error getting moves:', e);
    }
  });

  // Handle: Make Move
  socket.on('make_move', (data: { from: Position, to: Position, promotion?: any }) => {
    try {
      const success = game.makeMove(data.from, data.to, data.promotion);
      if (success) {
        // Broadcast new state to ALL clients
        io.emit('game_state', game.getGameState());
        io.emit('move_sound', { type: game.isGameOver ? 'win' : (game.inCheck ? 'check' : 'move') });
      } else {
        socket.emit('error', { message: 'Invalid Move' });
      }
    } catch (e) {
      console.error('Error making move:', e);
    }
  });

  // Handle: Reset Game
  socket.on('reset_game', (config?: { whiteArmy: ArmyType, blackArmy: ArmyType }) => {
    game = new ChessGame(config?.whiteArmy || 'western', config?.blackArmy || 'empire');
    io.emit('game_state', game.getGameState());
    io.emit('game_reset');
  });

  socket.on('disconnect', () => {
    console.log(`User Disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`[BACKEND] Server running on http://localhost:${PORT}`);
});
