import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { GameState, Player, Pawn, GameTask3D } from './types';
import { rollDice, calculateNextPosition, canMovePawn } from './utils/gameLogic';
import { generateTasks } from './utils/taskData';
import axios from 'axios';

interface GameContextType extends GameState {
  rollDiceAction: () => void;
  movePawnAction: (pawnId: string) => void;
  resetGame: () => void;
  skipTurn: () => void;
  dismissTask: () => void;
  setMovingPawnTarget: (target: { x: number; y: number; z: number } | null) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const API_URL = (process.env.REACT_APP_API_URL || '').replace(/\/api\/?$/, '');

const INITIAL_PLAYERS: Player[] = [
  { id: 'p1', name: '👦 男方', color: 'red', isComputer: false },
  { id: 'p2', name: '👧 女方', color: 'blue', isComputer: false },
];

const INITIAL_PAWNS: Pawn[] = [
  { id: 'r1', playerId: 'p1', color: 'red', position: -1, status: 'home', stepsMoved: 0 },
  { id: 'b1', playerId: 'p2', color: 'blue', position: -1, status: 'home', stepsMoved: 0 },
];

const fetchTasksFromAPI = async (): Promise<GameTask3D[]> => {
  try {
    const response = await axios.get(`${API_URL}/api/game/tasks`);
    const apiTasks = response.data;
    if (apiTasks && apiTasks.length > 0) {
      return apiTasks.map((task: any, index: number) => ({
        id: task.id || index + 1,
        title: task.title,
        description: task.description,
        position: task.position,
        type: task.type as GameTask3D['type'],
        reward: task.reward || 0,
        timeLimit: task.timeLimit || 0,
      }));
    }
  } catch (error) {
    console.warn('从API获取任务失败，使用本地默认任务:', error);
  }
  return generateTasks();
};

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<GameState>({
    players: INITIAL_PLAYERS,
    currentPlayerIndex: 0,
    diceValue: 0,
    phase: 'waiting',
    pawns: INITIAL_PAWNS,
    winner: null,
    logs: ['游戏开始！👦 男方先手'],
    tasks: [],
    currentTask: null,
    lastTriggeredPlayerId: null,
    movingPawnTarget: null,
  });

  useEffect(() => {
    fetchTasksFromAPI().then(tasks => {
      setState(prev => ({ ...prev, tasks }));
    });
  }, []);

  const currentPlayer = state.players[state.currentPlayerIndex];

  const addLog = useCallback((msg: string) => {
    setState(prev => ({ ...prev, logs: [msg, ...prev.logs].slice(0, 5) }));
  }, []);

  const nextTurn = useCallback(() => {
    setState(prev => {
      const nextIndex = (prev.currentPlayerIndex + 1) % prev.players.length;
      return {
        ...prev,
        currentPlayerIndex: nextIndex,
        phase: 'waiting' as const,
        diceValue: 0,
        logs: [`轮到 ${prev.players[nextIndex].name}`, ...prev.logs].slice(0, 5)
      };
    });
  }, []);

  const rollDiceAction = useCallback(() => {
    if (state.phase !== 'waiting' || state.winner) return;

    setState(prev => ({ ...prev, phase: 'rolling' }));

    setTimeout(() => {
      const val = rollDice();

      setState(prev => {
        const updatedState = {
          ...prev,
          diceValue: val,
          phase: 'moving' as const,
          logs: [`🎲 投出了 ${val} 点！`, ...prev.logs].slice(0, 5),
        };

        const playerPawns = updatedState.pawns.filter(p => p.playerId === currentPlayer.id);
        const hasMove = playerPawns.some(p => canMovePawn(p, val));

        if (!hasMove) {
          setTimeout(() => {
            addLog(`${val} 点无法移动，跳过回合`);
            nextTurn();
          }, 1000);
        } else {
          const movablePawn = playerPawns.find(p => canMovePawn(p, val));
          if (movablePawn) {
            setTimeout(() => {
              autoMovePawn(movablePawn.id, val);
            }, 600);
          }
        }

        return updatedState;
      });
    }, 500);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.winner, currentPlayer.id]);

  const autoMovePawn = useCallback((pawnId: string, diceVal: number) => {
    setState(prev => {
      if (prev.phase !== 'moving') return prev;

      const pawnIndex = prev.pawns.findIndex(p => p.id === pawnId);
      if (pawnIndex === -1) return prev;

      const pawn = prev.pawns[pawnIndex];
      const currentPlayerRef = prev.players[prev.currentPlayerIndex];

      if (!canMovePawn(pawn, diceVal)) return prev;

      const { position, status, completed } = calculateNextPosition(pawn, diceVal);

      let newPawns = [...prev.pawns];
      newPawns[pawnIndex] = {
        ...pawn,
        position: position,
        stepsMoved: position,
        status: status,
      };

      if (completed) {
        return {
          ...prev,
          pawns: newPawns,
          winner: currentPlayerRef.id,
          phase: 'finished' as const,
          currentTask: null,
          lastTriggeredPlayerId: null,
          logs: [`🎉 ${currentPlayerRef.name} 获胜！`, ...prev.logs],
        };
      }

      const landedPosition = position % 72;
      const task = prev.tasks.find(t => t.position === landedPosition);

      if (task && status === 'active') {
        if (task.type === 'FORWARD') {
          const forwardResult = calculateNextPosition(
            { ...pawn, position, stepsMoved: position, status: 'active' },
            task.reward
          );
          newPawns[pawnIndex] = {
            ...newPawns[pawnIndex],
            position: forwardResult.position,
            stepsMoved: forwardResult.position,
            status: forwardResult.status,
          };
        } else if (task.type === 'BACKWARD') {
          const newPos = Math.max(0, position - task.reward);
          newPawns[pawnIndex] = {
            ...newPawns[pawnIndex],
            position: newPos,
            stepsMoved: newPos,
          };
        }

        const nextIndex = diceVal === 6
          ? prev.currentPlayerIndex
          : (prev.currentPlayerIndex + 1) % prev.players.length;

        return {
          ...prev,
          pawns: newPawns,
          currentTask: task,
          lastTriggeredPlayerId: currentPlayerRef.id,
          phase: 'waiting' as const,
          currentPlayerIndex: nextIndex,
          diceValue: 0,
          logs: [
            `${currentPlayerRef.name} 触发: ${task.title}`,
            ...(diceVal === 6 ? ['投出6点！再来一次'] : []),
            ...prev.logs,
          ].slice(0, 5),
        };
      }

      const nextIndex = diceVal === 6
        ? prev.currentPlayerIndex
        : (prev.currentPlayerIndex + 1) % prev.players.length;

      return {
        ...prev,
        pawns: newPawns,
        currentTask: null,
        lastTriggeredPlayerId: null,
        phase: 'waiting' as const,
        currentPlayerIndex: nextIndex,
        diceValue: 0,
        logs: [
          ...(diceVal === 6 ? ['投出6点！再来一次'] : [`轮到 ${prev.players[nextIndex].name}`]),
          ...prev.logs,
        ].slice(0, 5),
      };
    });
  }, []);

  const movePawnAction = useCallback((pawnId: string) => {
    autoMovePawn(pawnId, state.diceValue);
  }, [autoMovePawn, state.diceValue]);

  const resetGame = useCallback(() => {
    fetchTasksFromAPI().then(tasks => {
      setState({
        players: INITIAL_PLAYERS,
        currentPlayerIndex: 0,
        diceValue: 0,
        phase: 'waiting',
        pawns: INITIAL_PAWNS,
        winner: null,
        logs: ['游戏重新开始！👦 男方先手'],
        tasks,
        currentTask: null,
        lastTriggeredPlayerId: null,
        movingPawnTarget: null,
      });
    });
  }, []);

  const dismissTask = useCallback(() => {
    setState(prev => ({ ...prev, currentTask: null, lastTriggeredPlayerId: null }));
  }, []);

  const setMovingPawnTarget = useCallback((target: { x: number; y: number; z: number } | null) => {
    setState(prev => ({ ...prev, movingPawnTarget: target }));
  }, []);

  const skipTurn = useCallback(() => nextTurn(), [nextTurn]);

  return (
    <GameContext.Provider value={{ ...state, rollDiceAction, movePawnAction, resetGame, skipTurn, dismissTask, setMovingPawnTarget }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
