import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BOARD_CONFIG } from '../constants';
import * as THREE from 'three';

/**
 * 沙滩主题中心：灯塔造型，作为终点标志。
 */
export const CenterTower: React.FC = () => {
  const sandHeight = BOARD_CONFIG.sandHeight;
  const lightBeamRef = useRef<THREE.Mesh>(null);
  const topLightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (lightBeamRef.current) {
      lightBeamRef.current.rotation.y = clock.getElapsedTime() * 1.5;
    }
    if (topLightRef.current) {
      topLightRef.current.intensity = 2.0 + Math.sin(clock.getElapsedTime() * 3) * 0.8;
    }
  });

  return (
    <group position={[0, sandHeight, 0]}>
      {/* 灯塔底座 - 石头基础 */}
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.0, 2.5, 0.6, 16]} />
        <meshStandardMaterial
          color="#a0a0a0"
          roughness={0.85}
          metalness={0.1}
        />
      </mesh>

      {/* 灯塔主体 - 白红条纹 */}
      <mesh position={[0, 2.5, 0]} castShadow>
        <cylinderGeometry args={[0.8, 1.2, 4.0, 16]} />
        <meshStandardMaterial
          color="#ffffff"
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>

      {/* 红色条纹装饰 */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[1.05, 1.15, 0.5, 16]} />
        <meshStandardMaterial
          color="#cc3333"
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>
      <mesh position={[0, 2.8, 0]}>
        <cylinderGeometry args={[0.88, 0.95, 0.5, 16]} />
        <meshStandardMaterial
          color="#cc3333"
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>

      {/* 灯塔顶部平台 */}
      <mesh position={[0, 4.7, 0]} castShadow>
        <cylinderGeometry args={[1.0, 0.8, 0.4, 16]} />
        <meshStandardMaterial
          color="#333333"
          roughness={0.3}
          metalness={0.5}
        />
      </mesh>

      {/* 灯塔灯罩 */}
      <mesh position={[0, 5.2, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 0.8, 16]} />
        <meshStandardMaterial
          color="#ffffe0"
          transparent
          opacity={0.6}
          roughness={0.1}
          metalness={0.2}
          emissive="#ffffe0"
          emissiveIntensity={0.8}
        />
      </mesh>

      {/* 灯塔尖顶 */}
      <mesh position={[0, 5.9, 0]}>
        <coneGeometry args={[0.5, 0.8, 8]} />
        <meshStandardMaterial
          color="#cc3333"
          roughness={0.3}
          metalness={0.2}
        />
      </mesh>

      {/* 旋转光束 */}
      <mesh ref={lightBeamRef} position={[0, 5.2, 0]}>
        <boxGeometry args={[6, 0.1, 0.3]} />
        <meshStandardMaterial
          color="#ffffaa"
          transparent
          opacity={0.3}
          emissive="#ffffaa"
          emissiveIntensity={1.5}
        />
      </mesh>

      {/* 灯塔顶部光源 */}
      <pointLight
        ref={topLightRef}
        position={[0, 5.5, 0]}
        intensity={2.5}
        distance={25}
        color="#ffffcc"
      />

      {/* 底部环境光 */}
      <pointLight
        position={[0, 1, 0]}
        intensity={0.5}
        distance={8}
        color="#ffd700"
      />
    </group>
  );
};
