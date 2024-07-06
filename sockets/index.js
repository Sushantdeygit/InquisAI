import { Server } from 'socket.io';
import interviewsHandler from './interview.js';
import { CLIENT_URL } from '../config/globals.config.js';

export default function initializeSocket(httpServer) {
    const io = new Server(httpServer, {
        cors: {
            origin: [CLIENT_URL]
        }
    }
    );

    // Socket.IO event handlers
    io.on('connection', (socket) => {
        console.log('A user connected');

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log('User disconnected');
        });
    });

    // Initialize other socket event handlers
    interviewsHandler(io);
    // Add other socket event handlers here if needed
}
