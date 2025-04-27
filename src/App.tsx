
import './App.css';
import { DrawingBoard, } from './screens/drawingBoard';

function App() {
  return (
    <div>
      <DrawingBoard selectedColor={'black'} lineThickness={10} currentShape={'pencil'} isEraser={false} />
    </div>
  );
}

export default App;
