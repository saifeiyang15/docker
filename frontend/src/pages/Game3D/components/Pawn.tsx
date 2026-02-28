import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group } from 'three';
import * as THREE from 'three';

interface PawnProps {
  position: Vector3;
  color: string;
  isActive: boolean;
  isFinished: boolean;
  isMoving: boolean;
  onClick: () => void;
  onMoveComplete?: () => void;
}

const PAWN_COLORS: Record<string, string> = {
  red: '#ff6b6b',
  blue: '#4ecdc4',
  green: '#ffe66d',
  yellow: '#95e1d3',
};

/** 弹跳曲线：0→1 过程中先升高再落下 */
const bounceEase = (progress: number): number => {
  return Math.sin(progress * Math.PI);
};

const MOVE_DURATION = 0.6;
const BOUNCE_HEIGHT = 3.0;

export const Pawn: React.FC<PawnProps> = ({ position, color, isActive, isFinished, isMoving, onClick, onMoveComplete }) => {
  const outerGroupRef = useRef<Group>(null);
  const innerGroupRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);

  const displayPosRef = useRef(new Vector3(position.x, position.y, position.z));
  const startPosRef = useRef(new Vector3(position.x, position.y, position.z));
  const targetPosRef = useRef(new Vector3(position.x, position.y, position.z));
  const moveProgressRef = useRef(1);
  const moveActiveRef = useRef(false);

  const pawnColor = PAWN_COLORS[color] || color;

  useEffect(() => {
    const newTarget = new Vector3(position.x, position.y, position.z);
    const currentDisplay = displayPosRef.current.clone();
    const distanceToTarget = currentDisplay.distanceTo(newTarget);

    if (distanceToTarget > 0.5 && isMoving) {
      startPosRef.current.copy(currentDisplay);
      targetPosRef.current.copy(newTarget);
      moveProgressRef.current = 0;
      moveActiveRef.current = true;
    } else if (!moveActiveRef.current) {
      displayPosRef.current.copy(newTarget);
      targetPosRef.current.copy(newTarget);
    }
  }, [position.x, position.y, position.z, isMoving]);

  useFrame((state, delta) => {
    if (!outerGroupRef.current || !innerGroupRef.current) return;

    if (moveActiveRef.current && moveProgressRef.current < 1) {
      moveProgressRef.current = Math.min(moveProgressRef.current + delta / MOVE_DURATION, 1);
      const progress = moveProgressRef.current;

      const smoothProgress = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      const interpX = THREE.MathUtils.lerp(startPosRef.current.x, targetPosRef.current.x, smoothProgress);
      const interpZ = THREE.MathUtils.lerp(startPosRef.current.z, targetPosRef.current.z, smoothProgress);
      const baseY = THREE.MathUtils.lerp(startPosRef.current.y, targetPosRef.current.y, smoothProgress);
      const bounceY = bounceEase(progress) * BOUNCE_HEIGHT;

      displayPosRef.current.set(interpX, baseY + bounceY, interpZ);
      outerGroupRef.current.position.copy(displayPosRef.current);

      innerGroupRef.current.rotation.y += delta * 8;
      const squashStretch = 1 + bounceEase(progress) * 0.2;
      innerGroupRef.current.scale.set(1 / squashStretch, squashStretch, 1 / squashStretch);

      if (progress >= 1) {
        moveActiveRef.current = false;
        displayPosRef.current.copy(targetPosRef.current);
        outerGroupRef.current.position.copy(targetPosRef.current);
        innerGroupRef.current.scale.set(1, 1, 1);
        onMoveComplete?.();
      }
    } else {
      if (isActive && !isFinished) {
        outerGroupRef.current.position.set(
          displayPosRef.current.x,
          displayPosRef.current.y + Math.sin(state.clock.elapsedTime * 3) * 0.3 + 0.5,
          displayPosRef.current.z
        );
        innerGroupRef.current.rotation.y = state.clock.elapsedTime * 2;
        const pulse = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.1;
        innerGroupRef.current.scale.setScalar(pulse);
      } else if (hovered) {
        outerGroupRef.current.position.set(
          displayPosRef.current.x,
          displayPosRef.current.y + 0.3,
          displayPosRef.current.z
        );
        innerGroupRef.current.scale.setScalar(1.15);
      } else {
        outerGroupRef.current.position.x = THREE.MathUtils.lerp(outerGroupRef.current.position.x, displayPosRef.current.x, 0.1);
        outerGroupRef.current.position.y = THREE.MathUtils.lerp(outerGroupRef.current.position.y, displayPosRef.current.y, 0.1);
        outerGroupRef.current.position.z = THREE.MathUtils.lerp(outerGroupRef.current.position.z, displayPosRef.current.z, 0.1);
        innerGroupRef.current.rotation.y = THREE.MathUtils.lerp(innerGroupRef.current.rotation.y, 0, 0.1);
        innerGroupRef.current.scale.lerp(new Vector3(1, 1, 1), 0.1);
      }
    }
  });

  return (
    <group ref={outerGroupRef} position={[position.x, position.y, position.z]}>
      <group
        ref={innerGroupRef}
        onClick={(e) => {
          e.stopPropagation();
          if (isActive && !isFinished) onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (isActive && !isFinished) {
            setHovered(true);
            document.body.style.cursor = 'pointer';
          }
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        {/* 球体底座 */}
        <mesh castShadow>
          <sphereGeometry args={[0.45, 32, 32]} />
          <meshStandardMaterial
            color={pawnColor}
            metalness={0.7}
            roughness={0.15}
            emissive={pawnColor}
            emissiveIntensity={isActive ? 0.6 : 0.3}
          />
        </mesh>

        {/* 锥体身体 */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <coneGeometry args={[0.32, 0.65, 32]} />
          <meshStandardMaterial
            color={pawnColor}
            metalness={0.8}
            roughness={0.15}
            emissive={pawnColor}
            emissiveIntensity={isActive ? 0.7 : 0.4}
          />
        </mesh>

        {/* 顶部小球 */}
        <mesh position={[0, 0.9, 0]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial
            color="#ffffff"
            metalness={0.9}
            roughness={0.1}
            emissive="#ffffff"
            emissiveIntensity={0.5}
          />
        </mesh>

        {/* 激活状态底部光环 */}
        {isActive && !isFinished && (
          <>
            <mesh position={[0, -0.6, 0]}>
              <cylinderGeometry args={[0.6, 0.6, 0.08, 32]} />
              <meshStandardMaterial
                color={pawnColor}
                transparent
                opacity={0.7}
                emissive={pawnColor}
                emissiveIntensity={1}
              />
            </mesh>
            <mesh position={[0, -0.55, 0]}>
              <torusGeometry args={[0.7, 0.05, 16, 32]} />
              <meshStandardMaterial
                color={pawnColor}
                transparent
                opacity={0.5}
                emissive={pawnColor}
                emissiveIntensity={1.2}
              />
            </mesh>
          </>
        )}

        {/* 完成状态金色十字光环 */}
        {isFinished && (
          <>
            <mesh position={[0, 1.1, 0]}>
              <torusGeometry args={[0.4, 0.1, 16, 32]} />
              <meshStandardMaterial
                color="#ffd700"
                metalness={0.95}
                roughness={0.05}
                emissive="#ffd700"
                emissiveIntensity={1}
              />
            </mesh>
            <mesh position={[0, 1.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.4, 0.1, 16, 32]} />
              <meshStandardMaterial
                color="#ffd700"
                metalness={0.95}
                roughness={0.05}
                emissive="#ffd700"
                emissiveIntensity={1}
              />
            </mesh>
          </>
        )}

        {/* 棋子点光源 */}
        <pointLight
          position={[0, 0.8, 0]}
          intensity={isActive ? 1.5 : 0.5}
          distance={5}
          color={pawnColor}
        />
      </group>
    </group>
  );
};
