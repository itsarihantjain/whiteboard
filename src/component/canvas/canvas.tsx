import { useRef, useState, useEffect, MouseEvent, useCallback } from 'react';
import { io } from 'socket.io-client';
import throttle from 'lodash/throttle';
import './canvas.css';

const socket = io('http://localhost:3001', {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
});

export const Canvas = ({ height, selectedColor, lineThickness, currentShape, isEraser }: CanvasProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startX, setStartX] = useState(0);
    const [startY, setStartY] = useState(0);
    const [snapshotImage, setSnapshotImage] = useState<ImageData | null>(null);
    const [lastEmittedPoint, setLastEmittedPoint] = useState<Point | null>(null);
    const [lastDrawTime, setLastDrawTime] = useState(0);
    const [pointBuffer, setPointBuffer] = useState<Point[]>([]);

    useEffect(() => {
        socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
        });

        socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('connect_error');
        };
    }, []);

    const emitDrawing = useCallback(
        throttle((data: DrawingData) => {
            socket.emit('drawing', {
                ...data,
                userId: socket.id,
            });
        }, 4),
        []
    );

    const emitBufferedPoints = useCallback(() => {
        if (pointBuffer.length > 0 && lastEmittedPoint) {
            const roomId = window.location.pathname.split('/').pop() || 'default';
            pointBuffer.forEach(point => {
                emitDrawing({
                    startX: lastEmittedPoint.x,
                    startY: lastEmittedPoint.y,
                    currentX: point.x,
                    currentY: point.y,
                    color: isEraser ? 'eraser' : selectedColor,
                    lineWidth: lineThickness,
                    shape: isEraser ? 'eraser' : currentShape,
                    roomId
                });
            });
            setPointBuffer([]);
        }
    }, [pointBuffer, lastEmittedPoint, selectedColor, lineThickness, currentShape, emitDrawing, isEraser]);

    const clearCanvas = useCallback(() => {
        if (canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                const imageData = context.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);

                context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

                context.putImageData(imageData, 0, 0);

                context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
        }
    }, []);

    useEffect(() => {
        const adjustCanvasSize = () => {
            if (canvasRef.current) {
                const canvas = canvasRef.current;
                canvas.width = window.innerWidth;
                canvas.height = height || 500;

                const context = canvas.getContext('2d');
                if (context) {
                    context.lineJoin = 'round';
                    context.lineCap = 'round';
                    context.strokeStyle = selectedColor;
                    context.lineWidth = lineThickness;
                }
            }
        };

        adjustCanvasSize();
        window.addEventListener('resize', adjustCanvasSize);
        return () => window.removeEventListener('resize', adjustCanvasSize);
    }, [height, selectedColor, lineThickness]);

    useEffect(() => {
        const handleClearCanvas = (data: { roomId: string }) => {
            const currentRoomId = window.location.pathname.split('/').pop() || 'default';
            if (data.roomId === currentRoomId) {
                clearCanvas();
            }
        };

        socket.on('canvas-cleared', handleClearCanvas);
        return () => {
            socket.off('canvas-cleared', handleClearCanvas);
        };
    }, [clearCanvas]);

    const resetCanvas = useCallback(() => {
        clearCanvas();
        const roomId = window.location.pathname.split('/').pop() || 'default';
        socket.emit('clear-canvas', { roomId });
    }, [clearCanvas]);

    useEffect(() => {
        socket.on('drawing', (data: DrawingData) => {
            const { startX, startY, currentX, currentY, color, lineWidth, shape } = data;

            if (canvasRef.current) {
                const context = canvasRef.current.getContext('2d');
                if (context) {
                    if (shape === 'eraser' || color === 'eraser') {
                        context.globalCompositeOperation = 'destination-out';
                        context.beginPath();
                        context.arc(currentX, currentY, lineWidth / 2, 0, Math.PI * 2);
                        context.fill();
                        context.globalCompositeOperation = 'source-over';
                        return;
                    }

                    context.globalCompositeOperation = 'source-over';
                    context.strokeStyle = color;
                    context.lineWidth = lineWidth;
                    context.lineJoin = 'round';
                    context.lineCap = 'round';

                    context.beginPath();
                    context.moveTo(startX, startY);
                    context.lineTo(currentX, currentY);
                    context.stroke();
                }
            }
        });

        return () => {
            socket.off('drawing');
        };
    }, []);

    const initiateDrawing = (e: MouseEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setStartX(x);
        setStartY(y);
        setLastEmittedPoint({ x, y });
        setLastDrawTime(Date.now());
        setPointBuffer([]);

        const context = canvasRef.current.getContext('2d');
        if (context && currentShape !== 'pencil' && !isEraser) {
            const imageData = context.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
            setSnapshotImage(imageData);
        }

        if (context) {
            if (isEraser) {
                context.globalCompositeOperation = 'destination-out';
            } else if (currentShape === 'pencil') {
                context.globalCompositeOperation = 'source-over';
                context.beginPath();
                context.moveTo(x, y);
            }
        }

        setIsDrawing(true);
    };

    const drawOnCanvas = (e: MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !canvasRef.current) return;

        const context = canvasRef.current.getContext('2d');
        if (!context) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        const currentTime = Date.now();
        const currentPoint = { x: currentX, y: currentY };

        if (isEraser) {
            context.beginPath();
            context.arc(currentX, currentY, lineThickness / 2, 0, Math.PI * 2);
            context.fill();

            if (lastEmittedPoint) {
                const distance = Math.sqrt(
                    Math.pow(currentX - lastEmittedPoint.x, 2) +
                    Math.pow(currentY - lastEmittedPoint.y, 2)
                );

                const timeSinceLastDraw = currentTime - lastDrawTime;

                if (distance > 1 || timeSinceLastDraw > 16) {
                    setPointBuffer(prev => [...prev, currentPoint]);

                    if (pointBuffer.length >= 3 || timeSinceLastDraw > 32) {
                        const roomId = window.location.pathname.split('/').pop() || 'default';
                        emitDrawing({
                            startX: lastEmittedPoint.x,
                            startY: lastEmittedPoint.y,
                            currentX,
                            currentY,
                            color: 'eraser',
                            lineWidth: lineThickness,
                            shape: 'eraser',
                            roomId
                        });
                        setLastEmittedPoint(currentPoint);
                        setLastDrawTime(currentTime);
                    }
                }
            }
        } else if (currentShape === 'pencil') {
            context.lineTo(currentX, currentY);
            context.stroke();

            if (lastEmittedPoint) {
                const distance = Math.sqrt(
                    Math.pow(currentX - lastEmittedPoint.x, 2) +
                    Math.pow(currentY - lastEmittedPoint.y, 2)
                );

                const timeSinceLastDraw = currentTime - lastDrawTime;

                if (distance > 1 || timeSinceLastDraw > 16) {
                    setPointBuffer(prev => [...prev, currentPoint]);

                    if (pointBuffer.length >= 3 || timeSinceLastDraw > 32) {
                        emitBufferedPoints();
                        setLastEmittedPoint(currentPoint);
                        setLastDrawTime(currentTime);
                    }
                }
            }
        } else if (snapshotImage) {
            context.putImageData(snapshotImage, 0, 0);

            context.beginPath();
            context.strokeStyle = selectedColor;
            context.lineWidth = lineThickness;

            const width = currentX - startX;
            const height = currentY - startY;

            switch (currentShape) {
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
    };

    const stopDrawing = (e: MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;

        const context = canvasRef.current?.getContext('2d');
        if (context) {
            context.globalCompositeOperation = 'source-over';
        }

        if (currentShape !== 'pencil' && !isEraser) {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (rect) {
                const currentX = e.clientX - rect.left;
                const currentY = e.clientY - rect.top;
                const roomId = window.location.pathname.split('/').pop() || 'default';
                emitDrawing({
                    startX,
                    startY,
                    currentX,
                    currentY,
                    color: selectedColor,
                    lineWidth: lineThickness,
                    shape: currentShape,
                    roomId
                });
            }
        } else {
            emitBufferedPoints();
        }

        const roomId = window.location.pathname.split('/').pop() || 'default';
        socket.emit('drawing-end', { userId: socket.id, roomId });

        setIsDrawing(false);
        setLastEmittedPoint(null);
        setPointBuffer([]);
    };

    return (
        <div className="canvas-wrapper">
            <canvas
                ref={canvasRef}
                style={{ width: '100%', height: `${height}px` }}
                onMouseDown={initiateDrawing}
                onMouseMove={drawOnCanvas}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
            />
            <button
                onClick={resetCanvas}
                className="reset-button"
                type="button"
            >
                Clear All
            </button>
        </div>
    );
};