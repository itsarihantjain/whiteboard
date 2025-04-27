import './toolbar.css';

export const Toolbar = ({
    selectedColor, setSelectedColor,
    lineThickness, setLineThickness,
    currentShape, setCurrentShape,
    isEraser, setIsEraser,
}: ToolbarProps) => {
    return (
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
                        <option value="pencil">Pencil</option>
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
        </div>
    );
};
