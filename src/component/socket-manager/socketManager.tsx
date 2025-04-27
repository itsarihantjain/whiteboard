import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useParams, useNavigate } from 'react-router-dom';
import './socketManager.css';


const socket = io('http://localhost:3001');

export const SocketManager = () => {
    const [roomId, setRoomId] = useState<string>('');
    const [isHost, setIsHost] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [userPaths, setUserPaths] = useState<Map<string, Point>>(new Map());

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

        socket.on('drawing', ({ startX, startY, currentX, currentY, color, lineWidth, shape, roomId }: DrawingData) => {
            const canvas = document.querySelector('canvas');
            if (!canvas) return;

            const context = canvas.getContext('2d');
            if (!context) return;

            if (shape === 'eraser' || color === 'eraser') {
                context.globalCompositeOperation = 'destination-out';
                context.beginPath();
                context.arc(currentX, currentY, lineWidth / 2, 0, Math.PI * 2);
                context.fill();
                context.globalCompositeOperation = 'source-over';

                setUserPaths(new Map(userPaths.set(roomId, { x: currentX, y: currentY })));
                return;
            }

            context.globalCompositeOperation = 'source-over';
            context.strokeStyle = color;
            context.lineWidth = lineWidth;
            context.lineJoin = 'round';
            context.lineCap = 'round';

            if (shape === 'pencil') {
                if (userPaths.has(roomId)) {
                    const lastPoint = userPaths.get(roomId);
                    if (lastPoint) {
                        context.beginPath();
                        context.moveTo(lastPoint.x, lastPoint.y);
                        context.lineTo(currentX, currentY);
                        context.stroke();
                    }
                } else {
                    context.beginPath();
                    context.moveTo(startX, startY);
                    context.lineTo(currentX, currentY);
                    context.stroke();
                }

                setUserPaths(new Map(userPaths.set(roomId, { x: currentX, y: currentY })));
            } else {
                context.beginPath();
                const width = currentX - startX;
                const height = currentY - startY;

                switch (shape) {
                    case 'line':
                        context.moveTo(startX, startY);
                        context.lineTo(currentX, currentY);
                        break;
                    case 'rectangle':
                        context.strokeRect(startX, startY, width, height);
                        break;
                    case 'square':
                        const sideLength = Math.min(Math.abs(width), Math.abs(height));
                        context.strokeRect(
                            startX,
                            startY,
                            width < 0 ? -sideLength : sideLength,
                            height < 0 ? -sideLength : sideLength
                        );
                        break;
                    case 'circle':
                        context.arc(
                            startX + width / 2,
                            startY + height / 2,
                            Math.sqrt(width * width + height * height) / 2,
                            0,
                            2 * Math.PI
                        );
                        break;
                    case 'triangle':
                        context.moveTo(startX, startY);
                        context.lineTo(currentX, currentY);
                        context.lineTo(startX * 2 - currentX, currentY);
                        context.closePath();
                        break;
                }
                context.stroke();
            }
        });

        socket.on('drawing-end', ({ roomId }) => {
            setUserPaths(prev => {
                const newPaths = new Map(prev);
                newPaths.delete(roomId);
                return newPaths;
            });
        });

        socket.on('canvas-cleared', ({ roomId: clearRoomId }) => {
            if (clearRoomId === id) {
                const canvas = document.querySelector('canvas');
                if (!canvas) return;

                const context = canvas.getContext('2d');
                if (!context) return;

                context.clearRect(0, 0, canvas.width, canvas.height);

                setUserPaths(new Map());
            }
        });

        return () => {
            socket.off('drawing');
            socket.off('drawing-end');
            socket.off('canvas-cleared');
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