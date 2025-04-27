import { useRef, useState, useEffect, MouseEvent } from 'react';

interface CanvasProps {
    height: number;
    selectedColor: string;
    lineThickness: number;
    currentShape: Shape;
    isEraser: boolean;
}

export const Canvas = ({ height, selectedColor, lineThickness, currentShape, isEraser }: CanvasProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startX, setStartX] = useState(0);
    const [startY, setStartY] = useState(0);
    const [snapshotImage, setSnapshotImage] = useState<ImageData | null>(null);

    useEffect(() => {
        const adjustCanvasSize = () => {
            if (canvasRef.current) {
                const canvas = canvasRef.current;
                canvas.width = window.innerWidth;
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
    }, [height, selectedColor, lineThickness]);

    const resetCanvas = () => {
        if (canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
        }
    };

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
        } else if (currentShape === 'pencil') {
            context.lineTo(currentX, currentY);
            context.stroke();
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
            <button onClick={resetCanvas} className="reset-button">
                Clear Canvas
            </button>
        </div>
    );
};
