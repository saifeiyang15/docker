import React, { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { useProgress } from '@react-three/drei';
import * as THREE from 'three';
import { SceneEnvironment } from './SceneEnvironment';
import { GameCamera } from './GameCamera';
import BackgroundScene from './BackgroundScene';

interface GameSceneProps {
  children?: React.ReactNode;
  onCameraAngleChange?: (azimuth: number, polar: number) => void;
  onLoadingProgress?: (progress: number) => void;
  onSceneReady?: () => void;
}

const LoadingTracker: React.FC<{
  onProgress?: (progress: number) => void;
}> = ({ onProgress }) => {
  const { progress } = useProgress();

  useEffect(() => {
    if (onProgress) {
      onProgress(Math.floor(progress));
    }
  }, [progress, onProgress]);

  return null;
};

export const GameScene: React.FC<GameSceneProps> = ({
  children,
  onCameraAngleChange,
  onLoadingProgress,
  onSceneReady,
}) => {
  return (
    <Canvas
      shadows
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 0.5,
        pixelRatio: Math.min(window.devicePixelRatio, 2),
      }}
    >
      <Suspense fallback={null}>
        <LoadingTracker onProgress={onLoadingProgress} />
        <GameCamera
          onAngleChange={onCameraAngleChange}
          onSceneReady={onSceneReady}
        />
        <SceneEnvironment />
        <BackgroundScene />
        {children}
      </Suspense>
    </Canvas>
  );
};
