import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useParams, useNavigate } from 'react-router-dom';
import './socketManager.css';

const socket = io('http://localhost:3001');

export const SocketManager = () => {
    const [roomId, setRoomId] = useState<string>('');
    const [isHost, setIsHost] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [userPaths, setUserPaths] = useState(new Map());

    const navigate = useNavigate();
    const { id } = useParams();

    useEffect(() => {
        if (id) {
            setRoomId(id);
            socket.emit('join-room', id);
        } else {
            const newRoomId = Math.random().toString(36).substring(7);
            setRoomId(newRoomId);
            setIsHost(true);
            navigate(`/room/${newRoomId}`);
        }

        socket.on('drawing', ({ startX, startY, currentX, currentY, color, lineWidth, shape, userId }) => {
            const canvas = document.querySelector('canvas');
            if (!canvas) return;

            const context = canvas.getContext('2d');
            if (!context) return;

            context.strokeStyle = color;
            context.lineWidth = lineWidth;
            context.lineJoin = 'round';
            context.lineCap = 'round';

            if (shape === 'pencil') {
                if (userPaths.has(userId)) {
                    const lastPoint = userPaths.get(userId);

                    context.beginPath();
                    context.moveTo(lastPoint.x, lastPoint.y);
                    context.lineTo(currentX, currentY);
                    context.stroke();
                } else {
                    context.beginPath();
                    context.moveTo(startX, startY);
                    context.lineTo(currentX, currentY);
                    context.stroke();
                }

                setUserPaths(new Map(userPaths.set(userId, { x: currentX, y: currentY })));
            } else {
                context.beginPath();
                const width = currentX - startX;
                const height = currentY - startY;


                context.stroke();
            }
        });

        socket.on('drawing-end', ({ userId }) => {
            setUserPaths(prev => {
                const newPaths = new Map(prev);
                newPaths.delete(userId);
                return newPaths;
            });
        });

        return () => {
            socket.off('drawing');
            socket.off('drawing-end');
        };
    }, [id, navigate, userPaths]);

    const shareLink = async () => {
        try {
            const link = `${window.location.origin}/room/${roomId}`;
            await navigator.clipboard.writeText(link);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            alert('Failed to copy link. Please try again.');
        }
    };

    return (
        <div className="socket-manager">
            {isHost && (
                <button
                    onClick={shareLink}
                    className={`share-button ${isCopied ? 'copied' : ''}`}
                >
                    {isCopied ? 'Link Copied!' : 'Share Drawing Room'}
                </button>
            )}
        </div>
    );
};
