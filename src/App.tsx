import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { DrawingBoard } from './screens/drawingBoard';

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<DrawingBoard />} />
          <Route path="/room/:id" element={<DrawingBoard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
