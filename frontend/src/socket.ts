import { io } from 'socket.io-client';

// Create a singleton socket instance
// In production, we will replace localhost with the deployed URL
const URL = import.meta.env.PROD ? undefined : 'http://localhost:3001';

export const socket = io(URL, {
    autoConnect: true,
    reconnection: true,
});
