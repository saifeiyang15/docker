import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUser } from '../utils/auth';
import websocketService from '../services/websocket';
import { GameState, Player } from '../types';
import GameBoard from '../components/GameBoard';
import '../styles/Game.css';

const Game: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [connected, setConnected] = useState(false);
  const navigate = useNavigate();
  const user = getUser();

  useEffect(() => {
    websocketService.connect(
      () => {
        setConnected(true);
        websocketService.subscribe(`/topic/game/${roomCode}`, handleGameUpdate);
        
        // 连接成功后，发送加入游戏的消息
        setTimeout(() => {
          websocketService.send(`/app/game/${roomCode}/join`, {
            userId: user.id,
            username: user.username
          });
        }, 500);
      },
      (error) => {
        console.error('WebSocket connection error:', error);
        alert('连接失败，请重试');
        navigate('/lobby');
      }
    );

    return () => {
      websocketService.disconnect();
    };
  }, [roomCode, navigate, user]);

  const handleGameUpdate = (message: any) => {
    setGameState(message);
  };

  const handleRollDice = () => {
    if (websocketService.isConnected()) {
      websocketService.send(`/app/game/${roomCode}/roll`, { userId: user.id });
    }
  };

  const handleLeaveRoom = () => {
    websocketService.disconnect();
    navigate('/lobby');
  };

  if (!connected) {
    return <div className="loading">连接中...</div>;
  }

  return (
    <div className="game-container">
      <div className="game-header">
        <h2>房间号：{roomCode}</h2>
        <button onClick={handleLeaveRoom} className="leave-btn">离开房间</button>
      </div>

      <div className="game-content">
        <div className="game-board-container">
          <GameBoard gameState={gameState} />
        </div>

        <div className="game-sidebar">
          <div className="players-list">
            <h3>玩家列表</h3>
            {gameState?.players.map((player: Player, index: number) => (
              <div
                key={player.id}
                className={`player-item ${index === gameState.currentPlayerIndex ? 'active' : ''}`}
              >
                <div className="player-color" style={{ backgroundColor: player.color }}></div>
                <span>{player.username}</span>
                {player.isFinished && <span className="finished-badge">已完成</span>}
              </div>
            ))}
          </div>

          <div className="game-controls">
            {gameState?.gameStatus === 'PLAYING' && (
              <>
                <div className="dice-display">
                  <div className="dice">{gameState.diceValue || '?'}</div>
                </div>
                <button
                  onClick={handleRollDice}
                  disabled={gameState.players[gameState.currentPlayerIndex]?.id !== user.id}
                  className="roll-dice-btn"
                >
                  掷骰子
                </button>
              </>
            )}
            {gameState?.gameStatus === 'WAITING' && (
              <p className="waiting-message">等待其他玩家加入...</p>
            )}
            {gameState?.gameStatus === 'FINISHED' && (
              <div className="game-result">
                <h3>游戏结束！</h3>
                <p>获胜者：{gameState.winner?.username}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;
