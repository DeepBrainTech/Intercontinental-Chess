import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

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

// Socket Event Handlers
io.on('connection', (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // Send initial handshake
  socket.emit('server_status', { 
    status: 'online', 
    timestamp: Date.now() 
  });

  socket.on('disconnect', () => {
    console.log(`User Disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`[BACKEND] Server running on http://localhost:${PORT}`);
});
