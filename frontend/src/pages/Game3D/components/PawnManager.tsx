import React, { useRef, useCallback, useEffect } from 'react';
import { useGame } from '../GameContext';
import { Pawn } from './Pawn';
import { getPawnPosition } from '../utils/pathUtils';

export const PawnManager: React.FC = () => {
  const { pawns, currentPlayerIndex, players, phase, movePawnAction, setMovingPawnTarget } = useGame();
  const currentPlayerId = players[currentPlayerIndex]?.id;
  const prevPawnPositionsRef = useRef<Record<string, { x: number; y: number; z: number }>>({});
  const movingPawnIdRef = useRef<string | null>(null);

  const pawnDataList = pawns.map((pawn) => {
    const playerPawns = pawns.filter(p => p.playerId === pawn.playerId);
    const pawnInternalIndex = playerPawns.findIndex(p => p.id === pawn.id);

    const position = getPawnPosition(
      pawn.stepsMoved,
      pawn.status,
      pawn.playerId,
      pawn.color,
      pawnInternalIndex
    );

    const prevPos = prevPawnPositionsRef.current[pawn.id];
    const hasMoved = prevPos && (
      Math.abs(prevPos.x - position.x) > 0.5 ||
      Math.abs(prevPos.z - position.z) > 0.5
    );

    return { pawn, position, hasMoved: !!hasMoved };
  });

  useEffect(() => {
    const movingPawn = pawnDataList.find(d => d.hasMoved);
    if (movingPawn) {
      movingPawnIdRef.current = movingPawn.pawn.id;
      setMovingPawnTarget({
        x: movingPawn.position.x,
        y: movingPawn.position.y,
        z: movingPawn.position.z,
      });
    }

    pawnDataList.forEach(({ pawn, position }) => {
      prevPawnPositionsRef.current[pawn.id] = { x: position.x, y: position.y, z: position.z };
    });
  });

  const handleMoveComplete = useCallback(() => {
    movingPawnIdRef.current = null;
    setMovingPawnTarget(null);
  }, [setMovingPawnTarget]);

  return (
    <group>
      {pawnDataList.map(({ pawn, position, hasMoved }) => {
        const isCurrentPlayerPawn = pawn.playerId === currentPlayerId;
        const isActive = isCurrentPlayerPawn && phase === 'moving' && pawn.status !== 'finished';
        const isThisPawnMoving = hasMoved || movingPawnIdRef.current === pawn.id;

        return (
          <Pawn
            key={pawn.id}
            position={position}
            color={pawn.color}
            isActive={isActive}
            isFinished={pawn.status === 'finished'}
            isMoving={isThisPawnMoving}
            onClick={() => {
              if (isActive) {
                movePawnAction(pawn.id);
              }
            }}
            onMoveComplete={handleMoveComplete}
          />
        );
      })}
    </group>
  );
};
