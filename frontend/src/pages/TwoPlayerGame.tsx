import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUser } from '../utils/auth';
import websocketService from '../services/websocket';
import { GameState, Player, DiceRollResult } from '../types';
import '../styles/TwoPlayerGame.css';

const TwoPlayerGame: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [connected, setConnected] = useState(false);
  const [diceRolling, setDiceRolling] = useState(false);
  const [lastRollResult, setLastRollResult] = useState<DiceRollResult | null>(null);
  const [animatingPiece, setAnimatingPiece] = useState<number | null>(null);
  const navigate = useNavigate();
  const user = getUser();

  useEffect(() => {
    websocketService.connect(
      () => {
        setConnected(true);
        websocketService.subscribe(`/topic/game/${roomCode}`, handleGameUpdate);
        websocketService.subscribe(`/topic/game/${roomCode}/dice`, handleDiceResult);
        
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

  const handleDiceResult = (result: DiceRollResult) => {
    setLastRollResult(result);
    setDiceRolling(false);
  };

  const handleRollDice = async () => {
    if (websocketService.isConnected() && !diceRolling) {
      setDiceRolling(true);
      setLastRollResult(null);
      websocketService.send(`/app/game/${roomCode}/roll`, { userId: user.id });
    }
  };

  const handleLeaveRoom = () => {
    websocketService.disconnect();
    navigate('/lobby');
  };

  const renderBoard = () => {
    if (!gameState) return null;

    const boardSize = 52; // 标准飞行棋棋盘
    const cells = [];

    for (let i = 0; i < boardSize; i++) {
      const playersOnCell = gameState.players.filter((p) => p.position.includes(i));
      
      cells.push(
        <div key={i} className={`board-cell ${playersOnCell.length > 0 ? 'occupied' : ''}`}>
          <span className="cell-number">{i}</span>
          {playersOnCell.map((player, idx) => (
            <div
              key={player.id}
              className={`game-piece ${animatingPiece === player.id ? 'animating' : ''}`}
              style={{
                backgroundColor: player.color,
                transform: `translate(${idx * 5}px, ${idx * 5}px)`,
              }}
            />
          ))}
        </div>
      );
    }

    return cells;
  };

  const renderDice = () => {
    if (diceRolling) {
      return (
        <div className="dice-container rolling">
          <div className="dice">?</div>
          <p className="dice-status">掷骰子中...</p>
        </div>
      );
    }

    if (lastRollResult) {
      return (
        <div className="dice-container">
          <div className="dice result">{lastRollResult.value}</div>
          {lastRollResult.message && (
            <p className="dice-message">{lastRollResult.message}</p>
          )}
        </div>
      );
    }

    return (
      <div className="dice-container">
        <div className="dice">{gameState?.diceValue || '?'}</div>
        <p className="dice-status">等待掷骰子</p>
      </div>
    );
  };

  const getCurrentPlayer = () => {
    if (!gameState) return null;
    return gameState.players[gameState.currentPlayerIndex];
  };

  const isMyTurn = () => {
    const currentPlayer = getCurrentPlayer();
    return currentPlayer?.id === user.id;
  };

  if (!connected) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>连接中...</p>
      </div>
    );
  }

  return (
    <div className="two-player-game">
      <div className="game-header">
        <div className="header-left">
          <h2>飞行棋对战</h2>
          <span className="room-code">房间号: {roomCode}</span>
        </div>
        <button onClick={handleLeaveRoom} className="btn-leave">
          离开房间
        </button>
      </div>

      <div className="game-main">
        <div className="players-panel">
          <h3>玩家信息</h3>
          {gameState?.players.map((player, index) => (
            <div
              key={player.id}
              className={`player-card ${
                index === gameState.currentPlayerIndex ? 'active' : ''
              } ${player.id === user.id ? 'me' : ''}`}
            >
              <div className="player-avatar" style={{ backgroundColor: player.color }}>
                {player.username.charAt(0).toUpperCase()}
              </div>
              <div className="player-info">
                <div className="player-name">
                  {player.username}
                  {player.id === user.id && <span className="me-badge">我</span>}
                </div>
                <div className="player-status">
                  {player.isFinished ? (
                    <span className="status-finished">已完成</span>
                  ) : index === gameState.currentPlayerIndex ? (
                    <span className="status-turn">回合中</span>
                  ) : (
                    <span className="status-waiting">等待中</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="game-board-container">
          <div className="game-board">{renderBoard()}</div>
        </div>

        <div className="game-controls-panel">
          {gameState?.gameStatus === 'WAITING' && (
            <div className="waiting-state">
              <div className="waiting-icon">⏳</div>
              <p>等待对手加入...</p>
            </div>
          )}

          {gameState?.gameStatus === 'PLAYING' && (
            <div className="playing-state">
              {renderDice()}
              
              <button
                onClick={handleRollDice}
                disabled={!isMyTurn() || diceRolling}
                className={`btn-roll-dice ${isMyTurn() && !diceRolling ? 'active' : ''}`}
              >
                {diceRolling ? '掷骰子中...' : isMyTurn() ? '掷骰子' : '等待对手'}
              </button>

              {isMyTurn() && (
                <div className="turn-indicator">
                  <span className="indicator-icon">👉</span>
                  <span>轮到你了！</span>
                </div>
              )}
            </div>
          )}

          {gameState?.gameStatus === 'FINISHED' && (
            <div className="finished-state">
              <div className="winner-trophy">🏆</div>
              <h3>游戏结束</h3>
              <p className="winner-name">
                获胜者: {gameState.winner?.username}
              </p>
              {gameState.winner?.id === user.id && (
                <p className="congratulations">恭喜你获得胜利！</p>
              )}
              <button onClick={() => navigate('/lobby')} className="btn-back">
                返回大厅
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="game-footer">
        <div className="game-tips">
          <h4>游戏提示</h4>
          <ul>
            <li>掷骰子后，棋子会自动移动相应步数</li>
            <li>遇到特殊格子会触发特殊效果</li>
            <li>率先到达终点的玩家获胜</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TwoPlayerGame;
