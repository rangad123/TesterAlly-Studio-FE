import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import AITestCreator from "./components/AITestCreator";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" 
          element={<AITestCreator />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
