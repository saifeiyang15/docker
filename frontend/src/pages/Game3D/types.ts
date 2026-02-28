export type PlayerColor = 'red' | 'blue' | 'green' | 'yellow';

export interface Player {
  id: string;
  name: string;
  color: PlayerColor;
  isComputer: boolean;
  avatar?: string;
}

export type GamePhase = 'waiting' | 'rolling' | 'moving' | 'finished';

export interface Pawn {
  id: string;
  playerId: string;
  color: PlayerColor;
  position: number;
  status: 'home' | 'active' | 'finished';
  stepsMoved: number;
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  diceValue: number;
  phase: GamePhase;
  pawns: Pawn[];
  winner: string | null;
  logs: string[];
  tasks: GameTask3D[];
  currentTask: GameTask3D | null;
  lastTriggeredPlayerId: string | null;
  /** 正在移动的棋子目标位置，供相机跟随使用 */
  movingPawnTarget: { x: number; y: number; z: number } | null;
}

export interface CameraState {
  position: [number, number, number];
  target: [number, number, number];
}

export type TaskType = 'FORWARD' | 'BACKWARD' | 'BONUS' | 'CHALLENGE';

export interface GameTask3D {
  id: number;
  title: string;
  description: string;
  position: number;
  type: TaskType;
  reward: number;
  timeLimit: number;
}
