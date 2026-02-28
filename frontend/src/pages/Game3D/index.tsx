import React, { useState, useEffect, useCallback } from 'react';
import { GameProvider, useGame } from './GameContext';
import { GameScene } from './components/GameScene';
import { GameBoard } from './components/GameBoard';
import { PawnManager } from './components/PawnManager';
import { GameHUD } from './components/UI/GameHUD';
import TaskEffectOverlay from '../../components/TaskEffectOverlay';
import './styles/Game3D.css';

const TaskEffectWrapper: React.FC = () => {
  const { currentTask } = useGame();
  const [showEffect, setShowEffect] = useState(false);
  const [effectTask, setEffectTask] = useState<{ type: 'FORWARD' | 'BACKWARD' | 'BONUS' | 'CHALLENGE'; title: string } | null>(null);

  useEffect(() => {
    if (currentTask && (currentTask.type === 'CHALLENGE' || currentTask.type === 'BONUS')) {
      setEffectTask({ type: currentTask.type, title: currentTask.title });
      setShowEffect(true);
    }
  }, [currentTask]);

  const handleEffectComplete = () => {
    setShowEffect(false);
    setEffectTask(null);
  };

  if (!showEffect || !effectTask) return null;

  return (
    <TaskEffectOverlay
      taskType={effectTask.type}
      taskTitle={effectTask.title}
      onComplete={handleEffectComplete}
      durationMs={3500}
    />
  );
};

const Game3DContent: React.FC = () => {
  const handleCameraAngleChange = useCallback(() => {}, []);
  const handleSceneReady = useCallback(() => {}, []);

  return (
    <div className="game3d-root">
      <div className="game3d-container">
        <GameScene
          onCameraAngleChange={handleCameraAngleChange}
          onSceneReady={handleSceneReady}
        >
          <GameBoard />
          <PawnManager />
        </GameScene>
      </div>

      {/* 精简 HUD：掷骰子 + 任务提示 */}
      <GameHUD />

      {/* 特殊任务特效弹窗 */}
      <TaskEffectWrapper />
    </div>
  );
};

const Game3D: React.FC = () => {
  return (
    <GameProvider>
      <Game3DContent />
    </GameProvider>
  );
};

export default Game3D;
