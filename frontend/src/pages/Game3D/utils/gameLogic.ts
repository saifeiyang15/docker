import { Pawn, Player, PlayerColor } from '../types';

export const rollDice = (): number => {
  return Math.floor(Math.random() * 6) + 1;
};

const getPlayerOffset = (color: PlayerColor): number => {
  switch (color) {
    case 'red': return 0;
    case 'blue': return 36;
    case 'green': return 18;
    case 'yellow': return 54;
    default: return 0;
  }
};

export const canMovePawn = (pawn: Pawn, diceValue: number): boolean => {
  if (pawn.status === 'finished') return false;
  if (pawn.status === 'home') {
    return diceValue === 6;
  }
  return true;
};

export const calculateNextPosition = (
  pawn: Pawn,
  diceValue: number
): { position: number; status: Pawn['status']; completed: boolean } => {
  if (pawn.status === 'home') {
    return { position: 0, status: 'active', completed: false };
  }

  let newStepCount = pawn.stepsMoved + diceValue;
  const STEPS_TO_ENTER_VICTORY = 72;
  const VICTORY_PATH_LENGTH = 6;
  
  if (newStepCount > STEPS_TO_ENTER_VICTORY + VICTORY_PATH_LENGTH) {
    const overshoot = newStepCount - (STEPS_TO_ENTER_VICTORY + VICTORY_PATH_LENGTH);
    newStepCount = (STEPS_TO_ENTER_VICTORY + VICTORY_PATH_LENGTH) - overshoot;
  }

  if (newStepCount === STEPS_TO_ENTER_VICTORY + VICTORY_PATH_LENGTH) {
    return { position: 100, status: 'finished', completed: true };
  }

  return { 
    position: newStepCount,
    status: 'active', 
    completed: false 
  };
};

export const checkCollision = (
  movedPawn: Pawn,
  allPawns: Pawn[],
  players: Player[]
): Pawn[] => {
  return allPawns;
};

export const getStartPosition = (color: PlayerColor): number => {
  return getPlayerOffset(color);
};
