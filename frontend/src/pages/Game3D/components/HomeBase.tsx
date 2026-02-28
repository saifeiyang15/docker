import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BOARD_CONFIG } from '../constants';
import { PlayerColor } from '../types';
import * as THREE from 'three';

interface HomeBaseProps {
  color: PlayerColor;
  position: [number, number, number];
}

const getColorHex = (color: PlayerColor) => {
  const colorMap: Record<string, string> = {
    red: '#ff6b6b',
    blue: '#4ecdc4',
    green: '#ffe66d',
    yellow: '#95e1d3',
  };
  return colorMap[color] || '#ffffff';
};

/**
 * 沙滩主题玩家基地：贝壳造型的出发点，
 * 放置在沙滩上，带有旗帜标识颜色。
 */
export const HomeBase: React.FC<HomeBaseProps> = ({ color, position }) => {
  const colorHex = getColorHex(color);
  const flagRef = useRef<THREE.Mesh>(null);
  const sandHeight = BOARD_CONFIG.sandHeight;

  useFrame(({ clock }) => {
    if (flagRef.current) {
      flagRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 2) * 0.1;
    }
  });

  return (
    <group position={[position[0], sandHeight + 0.05, position[2]]}>
      {/* 沙堆底座 */}
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.8, 2.2, 0.3, 16]} />
        <meshStandardMaterial
          color="#f5deb3"
          roughness={0.95}
          metalness={0.02}
        />
      </mesh>

      {/* 贝壳装饰 */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <sphereGeometry args={[1.2, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={colorHex}
          metalness={0.4}
          roughness={0.3}
          emissive={colorHex}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* 贝壳内部 */}
      <mesh position={[0, 0.36, 0]}>
        <sphereGeometry args={[1.0, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#fff5ee"
          metalness={0.2}
          roughness={0.4}
          side={THREE.BackSide}
        />
      </mesh>

      {/* 旗杆 */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 2.5, 8]} />
        <meshStandardMaterial color="#8B4513" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* 旗帜 */}
      <mesh ref={flagRef} position={[0.5, 2.4, 0]}>
        <planeGeometry args={[1.0, 0.6]} />
        <meshStandardMaterial
          color={colorHex}
          side={THREE.DoubleSide}
          emissive={colorHex}
          emissiveIntensity={0.4}
        />
      </mesh>

      {/* 颜色标识环 */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.8, 2.2, 32]} />
        <meshStandardMaterial
          color={colorHex}
          transparent
          opacity={0.5}
          emissive={colorHex}
          emissiveIntensity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 点光源 */}
      <pointLight
        position={[0, 3, 0]}
        intensity={0.8}
        distance={8}
        color={colorHex}
      />
    </group>
  );
};
