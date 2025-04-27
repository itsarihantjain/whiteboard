interface CanvasProps {
  height?: number;
}

type Shape = "pencil" | "line" | "rectangle" | "square" | "circle" | "triangle";

interface ToolbarProps {
  selectedColor: string;
  setSelectedColor: React.Dispatch<React.SetStateAction<string>>;
  lineThickness: number;
  setLineThickness: React.Dispatch<React.SetStateAction<number>>;
  currentShape: Shape;
  setCurrentShape: React.Dispatch<React.SetStateAction<Shape>>;
  isEraser: boolean;
  setIsEraser: React.Dispatch<React.SetStateAction<boolean>>;
}

interface CanvasProps {
  height: number;
  selectedColor: string;
  lineThickness: number;
  currentShape: Shape;
  isEraser: boolean;
}

interface DrawingData {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  color: string;
  lineWidth: number;
  shape: Shape;
  roomId: string;
}

interface Point {
  x: number;
  y: number;
}
