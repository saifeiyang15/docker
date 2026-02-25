import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Lobby from './pages/Lobby';
import Game from './pages/Game';
import TemplateManagement from './pages/TemplateManagement';
import TwoPlayerGame from './pages/TwoPlayerGame';
import SinglePlayerGame from './pages/SinglePlayerGame';
import GameConfigManagement from './pages/GameConfigManagement';
import { isAuthenticated } from './utils/auth';
import './App.css';

const PrivateRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/" />;
};

const App: React.FC = () => {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route
            path="/lobby"
            element={
              <PrivateRoute>
                <Lobby />
              </PrivateRoute>
            }
          />
          <Route
            path="/game/:roomCode"
            element={
              <PrivateRoute>
                <Game />
              </PrivateRoute>
            }
          />
          <Route
            path="/templates"
            element={
              <PrivateRoute>
                <TemplateManagement />
              </PrivateRoute>
            }
          />
          <Route
            path="/two-player/:roomCode"
            element={
              <PrivateRoute>
                <TwoPlayerGame />
              </PrivateRoute>
            }
          />
          <Route
            path="/single-player"
            element={
              <PrivateRoute>
                <SinglePlayerGame />
              </PrivateRoute>
            }
          />
          <Route
            path="/game-config"
            element={
              <PrivateRoute>
                <GameConfigManagement />
              </PrivateRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
