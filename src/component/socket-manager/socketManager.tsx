import { useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

export const SocketManager = () => {
    useEffect(() => {
        socket.on('drawing', ({ startX, startY, currentX, currentY, color, lineWidth, shape }) => {
        });

        return () => {
            socket.off('drawing');
        };
    }, []);

    return null;
};
