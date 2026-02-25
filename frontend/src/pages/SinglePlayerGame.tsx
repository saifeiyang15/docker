import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ThreeBackground from '../components/ThreeBackground';
import TaskEffectOverlay from '../components/TaskEffectOverlay';
import '../styles/SinglePlayerGame.css';

interface GameTask {
  id: number;
  title: string;
  description: string;
  position: number;
  type: 'FORWARD' | 'BACKWARD' | 'BONUS' | 'CHALLENGE';
  reward: number;
  timeLimit: number;
}

interface PlayerState {
  playerId: number;
  username: string;
  currentPosition: number;
  score: number;
  characterImage: string;
  color: string;
}

interface GameState {
  userId: number;
  player1: PlayerState;
  player2: PlayerState;
  currentTurn: number;
  diceValue: number;
  gameStatus: string;
  currentTask: GameTask | null;
  winner: number | null;
  tasks: GameTask[];
}

const DiceFace: React.FC<{ value: number }> = ({ value }) => {
  const dotPositions: Record<number, string[]> = {
    1: ['center'],
    2: ['top-right', 'bottom-left'],
    3: ['top-right', 'center', 'bottom-left'],
    4: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
    5: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
    6: ['top-left', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-right'],
  };

  const positions = dotPositions[value] || dotPositions[1];

  return (
    <div className="dice-face-dots">
      {positions.map((position, index) => (
        <span key={index} className={`dice-dot ${position}`} />
      ))}
    </div>
  );
};

const CountdownTimer: React.FC<{ seconds: number; onComplete: () => void }> = ({ seconds, onComplete }) => {
  const [remaining, setRemaining] = useState(seconds);
  
  useEffect(() => {
    if (remaining <= 0) {
      onComplete();
      return;
    }
    const timer = setTimeout(() => setRemaining(remaining - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining, onComplete]);

  const progress = (remaining / seconds) * 100;
  const isUrgent = remaining <= 5;

  return (
    <div className={`countdown-container ${isUrgent ? 'countdown-urgent' : ''}`}>
      <div className="countdown-ring">
        <svg viewBox="0 0 100 100">
          <circle className="countdown-bg" cx="50" cy="50" r="42" />
          <circle
            className="countdown-progress"
            cx="50" cy="50" r="42"
            strokeDasharray={`${2 * Math.PI * 42}`}
            strokeDashoffset={`${2 * Math.PI * 42 * (1 - progress / 100)}`}
          />
        </svg>
        <span className="countdown-number">{remaining}</span>
      </div>
      <span className="countdown-label">⏱️ 倒计时</span>
    </div>
  );
};

const BoySvgAvatar = () => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="48" fill="#E3F2FD"/>
    <circle cx="50" cy="42" r="22" fill="#FFD9B3"/>
    <path d="M28 35 Q30 15 50 12 Q70 15 72 35 Q72 28 65 25 Q55 20 45 20 Q35 20 28 28 Z" fill="#5D4037"/>
    <circle cx="40" cy="40" r="3" fill="#333"/>
    <circle cx="60" cy="40" r="3" fill="#333"/>
    <path d="M44 50 Q50 55 56 50" stroke="#E57373" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M30 65 Q50 58 70 65 Q75 85 70 95 L30 95 Q25 85 30 65Z" fill="#42A5F5"/>
  </svg>
);

const GirlSvgAvatar = () => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="48" fill="#FCE4EC"/>
    <circle cx="50" cy="42" r="22" fill="#FFD9B3"/>
    <path d="M22 40 Q20 15 50 10 Q80 15 78 40 Q78 30 70 22 Q60 15 50 15 Q40 15 30 22 Q22 30 22 40Z" fill="#5D4037"/>
    <path d="M22 40 Q18 55 25 65" stroke="#5D4037" strokeWidth="4" fill="none" strokeLinecap="round"/>
    <path d="M78 40 Q82 55 75 65" stroke="#5D4037" strokeWidth="4" fill="none" strokeLinecap="round"/>
    <circle cx="40" cy="40" r="3" fill="#333"/>
    <circle cx="60" cy="40" r="3" fill="#333"/>
    <path d="M38 38 Q40 35 42 38" stroke="#333" strokeWidth="1" fill="none"/>
    <path d="M58 38 Q60 35 62 38" stroke="#333" strokeWidth="1" fill="none"/>
    <path d="M44 50 Q50 55 56 50" stroke="#E57373" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <circle cx="35" cy="46" r="4" fill="#FFCDD2" opacity="0.6"/>
    <circle cx="65" cy="46" r="4" fill="#FFCDD2" opacity="0.6"/>
    <path d="M30 65 Q50 58 70 65 Q75 85 70 95 L30 95 Q25 85 30 65Z" fill="#EC407A"/>
  </svg>
);

const SinglePlayerGame: React.FC = () => {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [animatingPositionP1, setAnimatingPositionP1] = useState(0);
  const [animatingPositionP2, setAnimatingPositionP2] = useState(0);
  const [displayDiceValue, setDisplayDiceValue] = useState(1);
  const [lastRolledPlayer, setLastRolledPlayer] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showTaskEffect, setShowTaskEffect] = useState(false);
  const [effectTask, setEffectTask] = useState<GameTask | null>(null);

  const API_URL = (process.env.REACT_APP_API_URL || '').replace(/\/api\/?$/, '');

  useEffect(() => {
    startGame();
  }, []);

  const startGame = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        navigate('/');
        return;
      }
      const user = JSON.parse(userStr);
      const response = await axios.post(`${API_URL}/api/game/single/start`, {
        userId: user.id,
        username: user.username
      });
      
      setGameState(response.data);
      setAnimatingPositionP1(response.data.player1.currentPosition);
      setAnimatingPositionP2(response.data.player2.currentPosition);
      setLastRolledPlayer(null);
    } catch (error) {
      console.error('启动游戏失败:', error);
      alert('启动游戏失败，请重试');
    }
  };

  const rollDice = async () => {
    if (!gameState || isRolling || gameState.gameStatus !== 'PLAYING') {
      return;
    }

    setIsRolling(true);
    const currentPlayerId = gameState.currentTurn;
    
    try {
      const response = await axios.post(`${API_URL}/api/game/single/roll`, {
        userId: gameState.userId
      });

      const result = response.data;
      
      await animateDice(result.diceValue);
      
      const fromPosition = currentPlayerId === 1
        ? animatingPositionP1
        : animatingPositionP2;
      
      await animateMovement(fromPosition, result.newPosition, currentPlayerId);
      
      const finalPos = result.finalPosition ?? result.newPosition;
      if (finalPos !== result.newPosition) {
        await animateMovement(result.newPosition, finalPos, currentPlayerId);
      }
      
      setGameState(result.gameState);
      setLastRolledPlayer(currentPlayerId);
      
      if (result.task && result.task.timeLimit > 0) {
        setCountdown(result.task.timeLimit);
      } else {
        setCountdown(null);
      }
      
      if (result.task && (result.task.type === 'CHALLENGE' || result.task.type === 'BONUS')) {
        setEffectTask(result.task);
        setShowTaskEffect(true);
      }
      
      if (result.gameState.gameStatus === 'FINISHED') {
        const winnerName = result.gameState.winner === 1
          ? result.gameState.player1.username
          : result.gameState.player2.username;
        setTimeout(() => {
          alert(`🎉 ${winnerName} 获胜！`);
        }, 1000);
      }
      
    } catch (error) {
      console.error('掷骰子失败:', error);
      alert('掷骰子失败，请重试');
    } finally {
      setIsRolling(false);
    }
  };

  const animateDice = (finalValue: number): Promise<void> => {
    return new Promise((resolve) => {
      let count = 0;
      const interval = setInterval(() => {
        setDisplayDiceValue(Math.floor(Math.random() * 6) + 1);
        count++;
        if (count >= 15) {
          clearInterval(interval);
          setDisplayDiceValue(finalValue);
          resolve();
        }
      }, 80);
    });
  };

  const animateMovement = (from: number, to: number, playerId: number): Promise<void> => {
    return new Promise((resolve) => {
      if (from === to) {
        resolve();
        return;
      }
      let current = from;
      const step = from < to ? 1 : -1;
      const setPosition = playerId === 1 ? setAnimatingPositionP1 : setAnimatingPositionP2;
      const interval = setInterval(() => {
        current += step;
        setPosition(current);
        if (current === to) {
          clearInterval(interval);
          resolve();
        }
      }, 200);
    });
  };

  const resetGame = async () => {
    if (!gameState) return;
    
    try {
      await axios.post(`${API_URL}/api/game/single/reset/${gameState.userId}`);
      startGame();
    } catch (error) {
      console.error('重置游戏失败:', error);
      alert('重置游戏失败，请重试');
    }
  };

  const handleCountdownComplete = () => {
    setCountdown(null);
  };

  const renderPlayerMarkers = (position: number) => {
    const player1Here = animatingPositionP1 === position;
    const player2Here = animatingPositionP2 === position;
    
    if (!player1Here && !player2Here) return null;
    
    return (
      <div className={`player-markers ${player1Here && player2Here ? 'both-players' : ''}`}>
        {player1Here && (
          <div className="player-marker player1-marker">
            <BoySvgAvatar />
          </div>
        )}
        {player2Here && (
          <div className="player-marker player2-marker">
            <GirlSvgAvatar />
          </div>
        )}
      </div>
    );
  };

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case 'FORWARD': return '⬆️';
      case 'BACKWARD': return '⬇️';
      case 'BONUS': return '💰';
      case 'CHALLENGE': return '🏆';
      default: return '📋';
    }
  };

  const getTaskCellIcon = (type: string) => {
    switch (type) {
      case 'FORWARD': return '⬆';
      case 'BACKWARD': return '⬇';
      case 'BONUS': return '💰';
      case 'CHALLENGE': return '⚡';
      default: return '•';
    }
  };

  const renderBoardCell = (position: number) => {
    const player1Here = animatingPositionP1 === position;
    const player2Here = animatingPositionP2 === position;
    const task = gameState?.tasks.find(t => t.position === position);
    
    return (
      <div
        key={`cell-${position}`}
        className={`board-cell ${player1Here ? 'current-p1' : ''} ${player2Here ? 'current-p2' : ''} ${task ? `has-task task-cell-${task.type.toLowerCase()}` : ''}`}
        title={task ? `${task.title}: ${task.description}` : `位置 ${position}`}
      >
        <span className="position-number">{position}</span>
        {renderPlayerMarkers(position)}
        {task && <div className="task-indicator">{getTaskCellIcon(task.type)}</div>}
      </div>
    );
  };

  if (!gameState) {
    return <div className="loading">加载中...</div>;
  }

  const currentPlayer = gameState.currentTurn === 1 ? gameState.player1 : gameState.player2;

  return (
    <div className="single-player-game">
      {/* Three.js 3D 爱心粒子背景 */}
      <ThreeBackground />

      {/* 特殊任务 Three.js 特效弹窗 */}
      {showTaskEffect && effectTask && (
        <TaskEffectOverlay
          taskType={effectTask.type}
          taskTitle={effectTask.title}
          onComplete={() => setShowTaskEffect(false)}
          durationMs={3500}
        />
      )}

      <div className="game-header">
        <h1>💑 情侣飞行棋</h1>
        <div className="game-info">
          <span className="player-info player1-info">
            <span className="player-avatar-mini"><BoySvgAvatar /></span>
            {gameState.player1.username} (位置 {gameState.player1.currentPosition})
          </span>
          <span className="vs-badge">💕</span>
          <span className="player-info player2-info">
            <span className="player-avatar-mini"><GirlSvgAvatar /></span>
            {gameState.player2.username} (位置 {gameState.player2.currentPosition})
          </span>
        </div>
        <button onClick={() => navigate('/lobby')} className="back-button">
          返回大厅
        </button>
      </div>

      <div className="game-container">
        <div className="board-wrapper">
          <div className="game-board">
            {/* 上边: 0-10 (11格) */}
            <div className="board-row top-row">
              {Array.from({ length: 11 }, (_, i) => i).map(i => renderBoardCell(i))}
            </div>

            {/* 中间部分 */}
            <div className="board-middle">
              {/* 左边: 39-31 (9格) */}
              <div className="board-column left-column">
                {Array.from({ length: 9 }, (_, i) => 39 - i).map(i => renderBoardCell(i))}
              </div>

              {/* 中心区域 */}
              <div className="center-area">
                {/* 当前回合提示 */}
                <div className={`turn-indicator turn-player${gameState.currentTurn}`}>
                  <span className="turn-dot">{gameState.currentTurn === 1 ? '👦' : '👧'}</span>
                  <span className="turn-text">
                    {gameState.gameStatus === 'FINISHED' 
                      ? `🎉 ${gameState.winner === 1 ? gameState.player1.username : gameState.player2.username} 获胜！`
                      : `${currentPlayer.username} 的回合`
                    }
                  </span>
                </div>

                {/* 骰子展示区域（纯展示，无点击事件） */}
                <div className="dice-display">
                  <div className="dice-3d-wrapper">
                    <div className={`dice-3d ${isRolling ? 'dice-rolling' : ''} dice-show-${displayDiceValue}`}>
                      <div className="dice-3d-face dice-front"><DiceFace value={1} /></div>
                      <div className="dice-3d-face dice-back"><DiceFace value={6} /></div>
                      <div className="dice-3d-face dice-right"><DiceFace value={3} /></div>
                      <div className="dice-3d-face dice-left"><DiceFace value={4} /></div>
                      <div className="dice-3d-face dice-top"><DiceFace value={2} /></div>
                      <div className="dice-3d-face dice-bottom"><DiceFace value={5} /></div>
                    </div>
                  </div>
                </div>

                {/* 掷骰子按钮（独立按钮，与骰子展示分开） */}
                <button
                  onClick={rollDice}
                  disabled={isRolling || gameState.gameStatus !== 'PLAYING'}
                  className={`roll-button roll-button-player${gameState.currentTurn}`}
                >
                  {isRolling ? '🎲 掷骰中...' : `🎲 ${currentPlayer.username} 掷骰子`}
                </button>

                {/* 任务展示区域 */}
                <div className="task-display-center">
                  {gameState.currentTask && lastRolledPlayer ? (
                    <div className={`task-card task-card-player${lastRolledPlayer} task-type-${gameState.currentTask.type.toLowerCase()}`}>
                      <div className="task-card-top-row">
                        <div className="task-card-header">
                          <span className="task-icon">{getTaskTypeIcon(gameState.currentTask.type)}</span>
                          <h3 className="task-title">{gameState.currentTask.title}</h3>
                        </div>
                        {countdown !== null && countdown > 0 && (
                          <CountdownTimer seconds={countdown} onComplete={handleCountdownComplete} />
                        )}
                      </div>
                      <p className="task-description">{gameState.currentTask.description}</p>
                      <div className="task-bottom-row">
                        <div className="task-reward-badge">
                          {gameState.currentTask.type === 'FORWARD' && `⬆️ 前进 ${gameState.currentTask.reward} 步`}
                          {gameState.currentTask.type === 'BACKWARD' && `⬇️ 后退 ${gameState.currentTask.reward} 步`}
                          {gameState.currentTask.type === 'BONUS' && `💕 情侣任务`}
                          {gameState.currentTask.type === 'CHALLENGE' && `🏆 特殊挑战`}
                        </div>
                        <div className="task-player-label">
                          {lastRolledPlayer === 1 ? '👦' : '👧'} {lastRolledPlayer === 1 ? gameState.player1.username : gameState.player2.username} 触发
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="no-task-hint">
                      <div className="hint-icon">💑</div>
                      <p>掷骰子开始甜蜜冒险吧～</p>
                    </div>
                  )}
                </div>

                {gameState.gameStatus === 'FINISHED' && (
                  <button onClick={resetGame} className="reset-button">
                    🔄 重新开始
                  </button>
                )}
              </div>

              {/* 右边: 11-19 (9格) */}
              <div className="board-column right-column">
                {Array.from({ length: 9 }, (_, i) => 11 + i).map(i => renderBoardCell(i))}
              </div>
            </div>

            {/* 下边: 30-20 (11格) */}
            <div className="board-row bottom-row">
              {Array.from({ length: 11 }, (_, i) => 30 - i).map(i => renderBoardCell(i))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SinglePlayerGame;
