import { useState } from 'react';
import { COLORS } from '../colors/colors';
import { Canvas } from '../component/canvas';
import { Toolbar } from '../component/toolbar';
import { SocketManager } from '../component/socket-manager';

export const DrawingBoard = ({ height = 500 }: CanvasProps) => {
    const [selectedColor, setSelectedColor] = useState(COLORS.black);
    const [lineThickness, setLineThickness] = useState(5);
    const [currentShape, setCurrentShape] = useState<Shape>('pencil');
    const [isEraser, setIsEraser] = useState(false);

    return (
        <div className="drawing-board-container">
            <Toolbar
                selectedColor={selectedColor}
                setSelectedColor={setSelectedColor}
                lineThickness={lineThickness}
                setLineThickness={setLineThickness}
                currentShape={currentShape}
                setCurrentShape={setCurrentShape}
                isEraser={isEraser}
                setIsEraser={setIsEraser}
            />
            <Canvas
                height={height}
                selectedColor={selectedColor}
                lineThickness={lineThickness}
                currentShape={currentShape}
                isEraser={isEraser}
            />
            <SocketManager />
        </div>
    );
};
