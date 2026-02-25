export interface User {
  id: number;
  username: string;
  nickname?: string;
  email?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email?: string;
  nickname?: string;
}

export interface AuthResponse {
  token: string;
  userId: number;
  username: string;
  nickname?: string;
}

export interface GameRoom {
  id: number;
  roomCode: string;
  roomName: string;
  maxPlayers: number;
  currentPlayers: number;
  status: string;
  creatorId: number;
}

export interface Player {
  id: number;
  username: string;
  color: string;
  position: number[];
  isFinished: boolean;
}

export interface GameState {
  roomCode: string;
  players: Player[];
  currentPlayerIndex: number;
  diceValue: number;
  gameStatus: 'WAITING' | 'PLAYING' | 'FINISHED';
  winner?: Player;
}

export interface GameTemplate {
  id?: number;
  name: string;
  description: string;
  boardSize: number;
  maxPlayers: number;
  specialCells: SpecialCell[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SpecialCell {
  position: number;
  type: 'FORWARD' | 'BACKWARD' | 'SKIP' | 'EXTRA_TURN';
  value: number;
  description: string;
}

export interface DiceRollResult {
  value: number;
  playerId: number;
  canMove: boolean;
  message?: string;
}

export interface FriendPlayerState {
  playerId: number;
  userId: number;
  username: string;
  currentPosition: number;
  score: number;
  color: string;
}

export interface FriendGameTask {
  id: number;
  title: string;
  description: string;
  position: number;
  type: 'FORWARD' | 'BACKWARD' | 'BONUS' | 'CHALLENGE';
  reward: number;
  timeLimit: number;
}

export interface FriendGameState {
  roomCode: string;
  player1: FriendPlayerState;
  player2: FriendPlayerState | null;
  currentTurn: number;
  diceValue: number;
  gameStatus: 'WAITING' | 'PLAYING' | 'FINISHED' | 'CANCELLED';
  currentTask: FriendGameTask | null;
  winner: number | null;
  tasks: FriendGameTask[];
  message?: string;
}

export interface FriendRollResult {
  diceValue: number;
  newPosition: number;
  finalPosition: number;
  currentPlayerId: number;
  task: FriendGameTask | null;
  gameState: FriendGameState;
}
