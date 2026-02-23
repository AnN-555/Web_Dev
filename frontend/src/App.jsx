import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import Header from './components/header.jsx';
import Footer from './components/footer.jsx';
import Home from './pages/home.jsx';
import Games from './pages/games.jsx';
import GameDetail from './pages/game-detail.jsx';
import Login from './pages/login.jsx';
import Register from './pages/register.jsx';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/games" element={<Games />} />
            <Route path="/games/:slug" element={<GameDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
