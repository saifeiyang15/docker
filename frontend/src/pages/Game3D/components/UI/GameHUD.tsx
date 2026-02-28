import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../GameContext';
import { TASK_TYPE_FULL_ICONS } from '../../utils/taskData';
import '../../styles/Game3D.css';

/**
 * 精简版 HUD：只保留掷骰子按钮、当前回合提示、任务卡片。
 * 掷骰子时有数字翻滚动画效果。
 */
export const GameHUD: React.FC = () => {
  const {
    players,
    currentPlayerIndex,
    diceValue,
    phase,
    winner,
    currentTask,
    lastTriggeredPlayerId,
    rollDiceAction,
    resetGame,
    dismissTask,
  } = useGame();

  const currentPlayer = players[currentPlayerIndex];
  const canRoll = phase === 'waiting' && !winner;
  const isRolling = phase === 'rolling';

  const [rollingNumber, setRollingNumber] = useState(1);
  const rollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRolling) {
      rollingIntervalRef.current = setInterval(() => {
        setRollingNumber(prev => (prev % 6) + 1);
      }, 80);
    } else {
      if (rollingIntervalRef.current) {
        clearInterval(rollingIntervalRef.current);
        rollingIntervalRef.current = null;
      }
    }
    return () => {
      if (rollingIntervalRef.current) {
        clearInterval(rollingIntervalRef.current);
      }
    };
  }, [isRolling]);

  const getTurnLabel = (): string => {
    if (winner) {
      const winnerPlayer = players.find(p => p.id === winner);
      return `🎉 ${winnerPlayer?.name || ''} 获胜！`;
    }
    if (isRolling) return '🎲 投骰子中...';
    if (phase === 'moving') return `${currentPlayer.name} 移动中...`;
    return `轮到 ${currentPlayer.name}`;
  };

  const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

  return (
    <>
      {/* 顶部回合提示 */}
      <div className="hud-turn-bar">
        <span className="hud-turn-text">{getTurnLabel()}</span>
      </div>

      {/* 底部中央：掷骰子区域 */}
      <div className="hud-dice-area">
        {isRolling && (
          <div className="hud-dice-rolling">
            <span className="hud-dice-rolling-number">{diceEmojis[rollingNumber - 1]}</span>
          </div>
        )}
        {!isRolling && diceValue > 0 && (
          <div className="hud-dice-result">
            <span className="hud-dice-final">{diceEmojis[diceValue - 1]}</span>
            <span className="hud-dice-value">{diceValue}</span>
          </div>
        )}
        <button
          className={`hud-roll-button ${isRolling ? 'rolling' : ''}`}
          onClick={rollDiceAction}
          disabled={!canRoll}
        >
          {isRolling ? '🎲 投骰中...' : `🎲 ${currentPlayer.name} 掷骰子`}
        </button>
        {winner && (
          <button className="hud-reset-button" onClick={resetGame}>
            🔄 重新开始
          </button>
        )}
      </div>

      {/* 任务卡片弹出层（居中展示） */}
      {currentTask && lastTriggeredPlayerId && (
        <div className="hud-task-overlay">
          <div className={`hud-task-card task-type-${currentTask.type.toLowerCase()}`}>
            <div className="hud-task-header">
              <span className="hud-task-icon">{TASK_TYPE_FULL_ICONS[currentTask.type]}</span>
              <h3 className="hud-task-title">{currentTask.title}</h3>
            </div>
            <p className="hud-task-description">{currentTask.description}</p>
            <div className="hud-task-meta">
              <span className="hud-task-reward">
                {currentTask.type === 'FORWARD' && `⬆️ 前进 ${currentTask.reward} 步`}
                {currentTask.type === 'BACKWARD' && `⬇️ 后退 ${currentTask.reward} 步`}
                {currentTask.type === 'BONUS' && '💕 情侣任务'}
                {currentTask.type === 'CHALLENGE' && '🏆 特殊挑战'}
              </span>
              <span className="hud-task-player">
                {players.find(p => p.id === lastTriggeredPlayerId)?.name || ''} 触发
              </span>
            </div>
            <button className="hud-task-dismiss" onClick={dismissTask}>
              确认 ✓
            </button>
          </div>
        </div>
      )}
    </>
  );
};
