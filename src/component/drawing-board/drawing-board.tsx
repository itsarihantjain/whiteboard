import { useState, useEffect, useRef, MouseEvent } from 'react';
import { io } from 'socket.io-client';

import './drawing-board.css';
import { COLORS } from '../../colors/colors';

const socket = io('http://localhost:3001');

export const DrawingBoard = ({ height = 500 }: CanvasProps) => {
    const [isDrawing, setIsDrawing] = useState(false);
    const [selectedColor, setSelectedColor] = useState(COLORS.black);
    const [lineThickness, setLineThickness] = useState(5);
    const [currentShape, setCurrentShape] = useState<Shape>('pencil');
    const [startX, setStartX] = useState(0);
    const [startY, setStartY] = useState(0);
    const [snapshotImage, setSnapshotImage] = useState<ImageData | null>(null);
    const [isEraser, setIsEraser] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const adjustCanvasSize = () => {
            if (canvasRef.current && containerRef.current) {
                const canvas = canvasRef.current;
                const container = containerRef.current;

                canvas.width = container.clientWidth;
                canvas.height = height;

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
    }, [height]);

    useEffect(() => {
        if (canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                context.strokeStyle = selectedColor;
                context.lineWidth = lineThickness;
            }
        }
    }, [selectedColor, lineThickness]);

    useEffect(() => {
        socket.on('drawing', ({ startX, startY, currentX, currentY, color, lineWidth, shape }) => {
            const context = canvasRef.current?.getContext('2d');
            if (!context) return;

            context.strokeStyle = color;
            context.lineWidth = lineWidth;
            context.beginPath();

            if (shape === 'pencil' || shape === 'line') {
                context.moveTo(startX, startY);
                context.lineTo(currentX, currentY);
            }

            context.stroke();
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

        const context = canvasRef.current.getContext('2d');
        if (context && currentShape !== 'pencil' && !isEraser) {
            const imageData = context.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
            setSnapshotImage(imageData);
        }

        if (context && currentShape === 'pencil' && !isEraser) {
            context.beginPath();
            context.moveTo(x, y);
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

        if (isEraser) {

            context.clearRect(currentX - lineThickness / 2, currentY - lineThickness / 2, lineThickness, lineThickness);
            socket.emit('drawing', {
                startX: currentX,
                startY: currentY,
                currentX,
                currentY,
                color: 'white',
                lineThickness,
                currentShape: 'pencil',
            });
        } else if (currentShape === 'pencil') {
            context.lineTo(currentX, currentY);
            context.stroke();

            socket.emit('drawing', {
                startX,
                startY,
                currentX,
                currentY,
                selectedColor,
                lineThickness,
                currentShape,
            });

            setStartX(currentX);
            setStartY(currentY);
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
        if (currentShape !== 'pencil') drawOnCanvas(e);
        setIsDrawing(false);
    };

    const resetCanvas = () => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (context) {
            context.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    return (
        <div className="drawing-board-container">
            <div className="toolbar">
                <div className="toolbar-controls">
                    <div className="toolbar-item">
                        <label htmlFor="color">Color</label>
                        <input
                            type="color"
                            id="color"
                            value={selectedColor}
                            onChange={(e) => setSelectedColor(e.target.value)}
                        />
                    </div>
                    <div className="toolbar-item">
                        <label htmlFor="lineThickness">Line Thickness:</label>
                        <input
                            type="range"
                            id="lineThickness"
                            min="1"
                            max="20"
                            value={lineThickness}
                            onChange={(e) => setLineThickness(parseInt(e.target.value))}
                        />
                    </div>
                    <div className="toolbar-item">
                        <label htmlFor="shape">Shape</label>
                        <select
                            id="shape"
                            value={currentShape}
                            onChange={(e) => setCurrentShape(e.target.value as Shape)}
                        >
                            <option value="free">Pencil</option>
                            <option value="line">Line</option>
                            <option value="rectangle">Rectangle</option>
                            <option value="square">Square</option>
                            <option value="circle">Circle</option>
                            <option value="triangle">Triangle</option>
                        </select>
                    </div>
                    <div className="toolbar-item">
                        <label htmlFor="shape">{isEraser ? "For Draw" : 'For Erase'}</label>
                        <button onClick={() => setIsEraser(!isEraser)} className="eraser-button">
                            {isEraser ? `Switch to ${currentShape}` : 'Switch to Eraser'}
                        </button>
                    </div>
                </div>

                <button onClick={resetCanvas} className="reset-button">
                    Clear
                </button>
            </div>

            <div className="canvas-wrapper" ref={containerRef}>
                <canvas
                    ref={canvasRef}
                    style={{ width: '100%', height: `${height}px` }}
                    onMouseDown={initiateDrawing}
                    onMouseMove={drawOnCanvas}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                />
            </div>
        </div>
    );
};
