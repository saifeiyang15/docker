import { Vector3 } from 'three';
import { BOARD_CONFIG, PATH_MAP } from '../constants';

let cachedTrackPositions: Vector3[] | null = null;

/**
 * 生成沙滩上的棋格路径：72 个格子沿沙滩边缘蜿蜒分布，
 * 形成一个略带起伏的环形路径，贴合沙滩地形。
 */
export const getTrackPositions = (): Vector3[] => {
  if (cachedTrackPositions) return cachedTrackPositions;

  const positions: Vector3[] = [];
  const steps = PATH_MAP.totalSteps;
  const radius = BOARD_CONFIG.trackRadius;
  const sandY = BOARD_CONFIG.sandHeight + 0.15;

  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const wobble = Math.sin(angle * 6) * 0.6 + Math.cos(angle * 3) * 0.4;
    const currentRadius = radius + wobble;
    const posX = Math.cos(angle) * currentRadius;
    const posZ = Math.sin(angle) * currentRadius;
    const posY = sandY + Math.sin(angle * 4) * 0.05;
    positions.push(new Vector3(posX, posY, posZ));
  }

  cachedTrackPositions = positions;
  return positions;
};

export const getPawnPosition = (
  logicalPosition: number, 
  status: 'home' | 'active' | 'finished', 
  playerId: string,
  playerColor: string,
  pawnIndex: number
): Vector3 => {
  const homeDistance = BOARD_CONFIG.trackRadius + 4;
  const sandY = BOARD_CONFIG.sandHeight;
  const pawnHeight = sandY + 0.6;

  if (status === 'home') {
    let baseX = 0, baseZ = 0;
    if (playerColor === 'red') { baseX = homeDistance; baseZ = homeDistance; }
    else if (playerColor === 'blue') { baseX = -homeDistance; baseZ = -homeDistance; }
    else if (playerColor === 'green') { baseX = -homeDistance; baseZ = homeDistance; }
    else { baseX = homeDistance; baseZ = -homeDistance; }
    
    const offsetX = pawnIndex === 0 ? -0.5 : 0.5;
    return new Vector3(baseX + offsetX, pawnHeight, baseZ);
  }

  if (status === 'finished') {
    const angle = pawnIndex * Math.PI + (playerColor === 'red' ? 0 : Math.PI / 2);
    return new Vector3(Math.cos(angle) * 0.5, sandY + 4.0, Math.sin(angle) * 0.5);
  }

  const track = getTrackPositions();
  
  let startOffset = 0;
  if (playerColor === 'red') startOffset = 0;
  else if (playerColor === 'blue') startOffset = 36;
  else if (playerColor === 'green') startOffset = 18;
  else startOffset = 54;
  
  const totalSteps = 72;
  
  if (logicalPosition > totalSteps) {
    const entryVec = track[(startOffset - 1 + totalSteps) % totalSteps];
    const centerVec = new Vector3(0, sandY + 4.0, 0);
    
    const progress = (logicalPosition - totalSteps) / 6;
    return new Vector3().lerpVectors(entryVec, centerVec, Math.min(progress, 1));
  }
  
  const globalIndex = (startOffset + logicalPosition) % totalSteps;
  const pos = track[globalIndex] || new Vector3(0, 0, 0);
  return new Vector3(pos.x, pawnHeight, pos.z);
};
