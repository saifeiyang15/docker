import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUser } from '../utils/auth';
import { friendGameAPI } from '../services/api';
import websocketService from '../services/websocket';
import { FriendGameState, FriendRollResult, FriendGameTask } from '../types';
import ThreeBackground from '../components/ThreeBackground';
import TaskEffectOverlay from '../components/TaskEffectOverlay';
import '../styles/FriendGame.css';

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

const FriendGame: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const user = getUser();

  const [gameState, setGameState] = useState<FriendGameState | null>(null);
  const [connected, setConnected] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [animatingPositionP1, setAnimatingPositionP1] = useState(0);
  const [animatingPositionP2, setAnimatingPositionP2] = useState(0);
  const [displayDiceValue, setDisplayDiceValue] = useState(1);
  const [lastRolledPlayer, setLastRolledPlayer] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showTaskEffect, setShowTaskEffect] = useState(false);
  const [effectTask, setEffectTask] = useState<FriendGameTask | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGameStateUpdate = useCallback((state: any) => {
    if (state.gameStatus === 'CANCELLED') {
      alert('对方已离开游戏');
      navigate('/lobby');
      return;
    }
    setGameState(state as FriendGameState);
    if (state.player1) {
      setAnimatingPositionP1(state.player1.currentPosition);
    }
    if (state.player2) {
      setAnimatingPositionP2(state.player2.currentPosition);
    }
  }, [navigate]);

  const handleRollResult = useCallback(async (result: FriendRollResult) => {
    const currentPlayerId = result.currentPlayerId;

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
      const winnerPlayer = result.gameState.winner === 1
        ? result.gameState.player1
        : result.gameState.player2;
      setTimeout(() => {
        alert(`🎉 ${winnerPlayer?.username} 获胜！`);
      }, 1000);
    }

    setIsRolling(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animatingPositionP1, animatingPositionP2]);

  useEffect(() => {
    if (!roomCode || !user) return;

    websocketService.connect(
      () => {
        setConnected(true);
        websocketService.subscribe(`/topic/friend/${roomCode}`, handleGameStateUpdate);
        websocketService.subscribe(`/topic/friend/${roomCode}/roll`, handleRollResult);
        websocketService.subscribe(`/topic/friend/${roomCode}/error`, (error: any) => {
          console.error('Game error:', error);
        });

        setTimeout(() => {
          websocketService.send(`/app/friend/${roomCode}/join`, {
            userId: user.id,
            username: user.nickname || user.username,
          });
        }, 500);
      },
      (error) => {
        console.error('WebSocket connection error:', error);
        alert('连接失败，请重试');
        navigate('/lobby');
      }
    );

    friendGameAPI.getGameState(roomCode).then((state) => {
      if (state) {
        setGameState(state);
        if (state.player1) setAnimatingPositionP1(state.player1.currentPosition);
        if (state.player2) setAnimatingPositionP2(state.player2.currentPosition);
      }
    }).catch(() => {});

    return () => {
      websocketService.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode]);

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

  const handleRollDice = () => {
    if (!gameState || isRolling || gameState.gameStatus !== 'PLAYING') return;
    if (!isMyTurn()) return;

    setIsRolling(true);
    websocketService.send(`/app/friend/${roomCode}/roll`, {
      userId: user.id,
    });
  };

  const handleLeaveRoom = () => {
    websocketService.send(`/app/friend/${roomCode}/leave`, {
      userId: user.id,
    });
    websocketService.disconnect();
    navigate('/lobby');
  };

  const handleCopyRoomCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleCountdownComplete = () => {
    setCountdown(null);
  };

  const getMyPlayerNumber = (): number | null => {
    if (!gameState || !user) return null;
    if (gameState.player1?.userId === user.id) return 1;
    if (gameState.player2?.userId === user.id) return 2;
    return null;
  };

  const isMyTurn = (): boolean => {
    return getMyPlayerNumber() === gameState?.currentTurn;
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

  const renderBoardCell = (position: number) => {
    const player1Here = animatingPositionP1 === position;
    const player2Here = animatingPositionP2 === position;
    const task = gameState?.tasks?.find(t => t.position === position);

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

  if (!connected && !gameState) {
    return (
      <div className="friend-game-loading">
        <ThreeBackground />
        <div className="loading-content">
          <div className="loading-spinner-heart">💕</div>
          <p>连接中...</p>
        </div>
      </div>
    );
  }

  const currentPlayer = gameState?.currentTurn === 1 ? gameState?.player1 : gameState?.player2;
  const myPlayerNumber = getMyPlayerNumber();

  return (
    <div className="single-player-game friend-game-page">
      <ThreeBackground />

      {showTaskEffect && effectTask && (
        <TaskEffectOverlay
          taskType={effectTask.type}
          taskTitle={effectTask.title}
          onComplete={() => setShowTaskEffect(false)}
          durationMs={3500}
        />
      )}

      <div className="game-header">
        <h1>💑 好友对战</h1>
        <div className="game-info">
          {gameState?.player1 && (
            <span className="player-info player1-info">
              <span className="player-avatar-mini"><BoySvgAvatar /></span>
              {gameState.player1.username}
              {myPlayerNumber === 1 && <span className="me-tag">(我)</span>}
              {' '}(位置 {gameState.player1.currentPosition})
            </span>
          )}
          <span className="vs-badge">💕</span>
          {gameState?.player2 ? (
            <span className="player-info player2-info">
              <span className="player-avatar-mini"><GirlSvgAvatar /></span>
              {gameState.player2.username}
              {myPlayerNumber === 2 && <span className="me-tag">(我)</span>}
              {' '}(位置 {gameState.player2.currentPosition})
            </span>
          ) : (
            <span className="player-info player2-info waiting-text">等待好友加入...</span>
          )}
        </div>
        <button onClick={handleLeaveRoom} className="back-button">
          离开房间
        </button>
      </div>

      {gameState?.gameStatus === 'WAITING' && (
        <div className="waiting-overlay">
          <div className="waiting-card">
            <div className="waiting-icon">💌</div>
            <h2>等待好友加入</h2>
            <p>将房间号分享给你的好友吧～</p>
            <div className="room-code-display">
              <span className="room-code-label">房间号</span>
              <span className="room-code-value">{roomCode}</span>
              <button onClick={handleCopyRoomCode} className="copy-btn">
                {copied ? '✅ 已复制' : '📋 复制'}
              </button>
            </div>
            <div className="waiting-animation">
              <span>💕</span>
              <span>💕</span>
              <span>💕</span>
            </div>
          </div>
        </div>
      )}

      <div className="game-container">
        <div className="board-wrapper">
          <div className="game-board">
            <div className="board-row top-row">
              {Array.from({ length: 11 }, (_, i) => i).map(i => renderBoardCell(i))}
            </div>

            <div className="board-middle">
              <div className="board-column left-column">
                {Array.from({ length: 9 }, (_, i) => 39 - i).map(i => renderBoardCell(i))}
              </div>

              <div className="center-area">
                <div className={`turn-indicator turn-player${gameState?.currentTurn || 1}`}>
                  <span className="turn-dot">{gameState?.currentTurn === 1 ? '👦' : '👧'}</span>
                  <span className="turn-text">
                    {gameState?.gameStatus === 'FINISHED'
                      ? `🎉 ${gameState.winner === 1 ? gameState.player1?.username : gameState.player2?.username} 获胜！`
                      : gameState?.gameStatus === 'PLAYING'
                        ? isMyTurn()
                          ? '轮到你了！'
                          : `${currentPlayer?.username} 的回合`
                        : '等待开始...'
                    }
                  </span>
                </div>

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

                <button
                  onClick={handleRollDice}
                  disabled={isRolling || gameState?.gameStatus !== 'PLAYING' || !isMyTurn()}
                  className={`roll-button roll-button-player${myPlayerNumber || 1}`}
                >
                  {isRolling
                    ? '🎲 掷骰中...'
                    : !isMyTurn()
                      ? '⏳ 等待对方...'
                      : '🎲 掷骰子'
                  }
                </button>

                <div className="task-display-center">
                  {gameState?.currentTask && lastRolledPlayer ? (
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
                          {lastRolledPlayer === 1 ? '👦' : '👧'} {lastRolledPlayer === 1 ? gameState.player1?.username : gameState.player2?.username} 触发
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="no-task-hint">
                      <div className="hint-icon">💑</div>
                      <p>和好友一起甜蜜冒险吧～</p>
                    </div>
                  )}
                </div>

                {gameState?.gameStatus === 'FINISHED' && (
                  <button onClick={() => navigate('/lobby')} className="reset-button">
                    🏠 返回大厅
                  </button>
                )}
              </div>

              <div className="board-column right-column">
                {Array.from({ length: 9 }, (_, i) => 11 + i).map(i => renderBoardCell(i))}
              </div>
            </div>

            <div className="board-row bottom-row">
              {Array.from({ length: 11 }, (_, i) => 30 - i).map(i => renderBoardCell(i))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FriendGame;
