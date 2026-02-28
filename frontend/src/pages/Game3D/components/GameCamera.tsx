import React, { useRef, useCallback, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useProgress } from '@react-three/drei';
import * as THREE from 'three';
import { CAMERA_DEFAULT } from '../constants';
import { useGame } from '../GameContext';

/**
 * 根据球面坐标（方位角、极角、距离）计算相机位置
 */
const sphericalToCartesian = (azimuthDeg: number, polarDeg: number, distance: number, target: THREE.Vector3): THREE.Vector3 => {
  const azimuthRad = THREE.MathUtils.degToRad(azimuthDeg);
  const polarRad = THREE.MathUtils.degToRad(polarDeg);
  const x = target.x + distance * Math.sin(polarRad) * Math.cos(azimuthRad);
  const y = target.y + distance * Math.cos(polarRad);
  const z = target.z + distance * Math.sin(polarRad) * Math.sin(azimuthRad);
  return new THREE.Vector3(x, y, z);
};

const CAMERA_START = new THREE.Vector3(0, 200, 300);
const CAMERA_END = sphericalToCartesian(
  CAMERA_DEFAULT.azimuthDeg,
  CAMERA_DEFAULT.polarDeg,
  CAMERA_DEFAULT.distance,
  CAMERA_DEFAULT.target
);
const TARGET_END = CAMERA_DEFAULT.target.clone();
const FLY_IN_DURATION = 4000;

/** 跟随模式下相机距离棋子的偏移 */
const FOLLOW_DISTANCE = 20;
const FOLLOW_HEIGHT = 12;
const FOLLOW_LERP_SPEED = 0.03;
const RETURN_LERP_SPEED = 0.02;

interface GameCameraProps {
  onAngleChange?: (azimuth: number, polar: number) => void;
  onSceneReady?: () => void;
}

export const GameCamera: React.FC<GameCameraProps> = ({ onAngleChange, onSceneReady }) => {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const controlsRef = useRef<any>(null);
  const [flyInState, setFlyInState] = useState<'waiting' | 'flying' | 'done'>('waiting');
  const flyStartTimeRef = useRef<number>(0);
  const hasCalledReadyRef = useRef(false);
  const { progress, active } = useProgress();
  const { movingPawnTarget } = useGame();

  const followTargetRef = useRef(new THREE.Vector3());
  const followCamPosRef = useRef(new THREE.Vector3());
  const isFollowingRef = useRef(false);

  useEffect(() => {
    if (!active && progress === 100 && flyInState === 'waiting') {
      flyStartTimeRef.current = performance.now();
      setFlyInState('flying');
    }
  }, [active, progress, flyInState]);

  const handleChange = useCallback((event: any) => {
    if (event?.target && onAngleChange && flyInState === 'done') {
      const azimuth = Math.round((event.target.getAzimuthalAngle() * 180 / Math.PI + 360) % 360);
      const polar = Math.round(event.target.getPolarAngle() * 180 / Math.PI);
      onAngleChange(azimuth, polar);
    }
  }, [onAngleChange, flyInState]);

  useFrame(() => {
    if (!cameraRef.current || !controlsRef.current) return;

    /* 飞入动画阶段 */
    if (flyInState === 'flying') {
      const elapsed = performance.now() - flyStartTimeRef.current;
      const rawProgress = Math.min(elapsed / FLY_IN_DURATION, 1);
      const easeOutCubic = 1 - Math.pow(1 - rawProgress, 3);

      cameraRef.current.position.lerpVectors(CAMERA_START, CAMERA_END, easeOutCubic);
      controlsRef.current.target.lerpVectors(
        new THREE.Vector3(0, 50, 0),
        TARGET_END,
        easeOutCubic
      );
      controlsRef.current.update();

      if (rawProgress >= 1) {
        setFlyInState('done');
        if (onSceneReady && !hasCalledReadyRef.current) {
          hasCalledReadyRef.current = true;
          onSceneReady();
        }
      }
      return;
    }

    if (flyInState !== 'done') return;

    /* 棋子移动时相机跟随 */
    if (movingPawnTarget) {
      isFollowingRef.current = true;

      const pawnPos = new THREE.Vector3(movingPawnTarget.x, movingPawnTarget.y, movingPawnTarget.z);
      followTargetRef.current.lerp(pawnPos, FOLLOW_LERP_SPEED);

      const cameraDirection = new THREE.Vector3()
        .subVectors(cameraRef.current.position, controlsRef.current.target)
        .normalize();
      followCamPosRef.current.set(
        followTargetRef.current.x + cameraDirection.x * FOLLOW_DISTANCE,
        followTargetRef.current.y + FOLLOW_HEIGHT,
        followTargetRef.current.z + cameraDirection.z * FOLLOW_DISTANCE
      );

      controlsRef.current.target.lerp(followTargetRef.current, FOLLOW_LERP_SPEED);
      cameraRef.current.position.lerp(followCamPosRef.current, FOLLOW_LERP_SPEED);
      controlsRef.current.update();
    } else if (isFollowingRef.current) {
      /* 棋子移动结束，平滑恢复到默认视角 */
      const distToDefault = controlsRef.current.target.distanceTo(TARGET_END);

      controlsRef.current.target.lerp(TARGET_END, RETURN_LERP_SPEED);
      cameraRef.current.position.lerp(CAMERA_END, RETURN_LERP_SPEED);
      controlsRef.current.update();

      if (distToDefault < 0.5) {
        isFollowingRef.current = false;
      }
    }
  });

  return (
    <>
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        position={[CAMERA_START.x, CAMERA_START.y, CAMERA_START.z]}
        fov={CAMERA_DEFAULT.fov}
        near={0.1}
        far={20000}
      />
      <OrbitControls
        ref={controlsRef}
        target={[0, 50, 0]}
        enablePan={false}
        enableZoom={flyInState === 'done'}
        enableRotate={flyInState === 'done'}
        enableDamping
        minDistance={10}
        maxDistance={300}
        maxPolarAngle={Math.PI * 0.48}
        minPolarAngle={Math.PI / 12}
        makeDefault
        onChange={handleChange}
      />
    </>
  );
};
