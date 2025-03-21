import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css';
import Navbar from  './components/Navbar'
import Home from './pages/Home';
import Topbar from './components/Topbar';


function App() {
  return (
    <div className='min-h-screen flex flex-col items-center'>
      <Router>
        <Topbar />
        <div className='flex-1 w-full max-w-screen-xl p-6'>
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        </div>
        <Navbar />
      </Router>
    </div>
  );
}

export default App;
