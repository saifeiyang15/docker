import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { getTrackPositions } from '../utils/pathUtils';
import { useGame } from '../GameContext';
import { TASK_TYPE_ICONS, TASK_TYPE_COLORS } from '../utils/taskData';

/**
 * 沙滩主题棋格轨道：贝壳/鹅卵石风格的圆形格子，
 * 沿沙滩环形路径分布，起点用海星标记。
 */
export const Track: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const { tasks } = useGame();

  const trackPositions = useMemo(() => {
    const vecs = getTrackPositions();
    return vecs.map((v, i) => ({ pos: [v.x, v.y, v.z] as [number, number, number], index: i }));
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.Group) {
          const firstMesh = child.children[0];
          if (firstMesh instanceof THREE.Mesh) {
            firstMesh.position.y = Math.sin(state.clock.elapsedTime * 1.5 + i * 0.15) * 0.015;
          }
        }
      });
    }
  });

  return (
    <group ref={groupRef}>
      {trackPositions.map(({ pos, index }) => {
        const isStartPoint = index % 18 === 0;
        const task = tasks.find(t => t.position === index);
        const taskColor = task ? TASK_TYPE_COLORS[task.type] : undefined;

        const defaultColor = '#e8d5b7';
        const cellColor = isStartPoint ? '#4a90d9' : taskColor || defaultColor;

        return (
          <group key={index}>
            {/* 棋格 - 鹅卵石风格圆盘 */}
            <mesh
              position={[pos[0], pos[1] + 0.08, pos[2]]}
              castShadow
              receiveShadow
            >
              <cylinderGeometry args={[0.45, 0.5, 0.16, 24]} />
              <meshStandardMaterial
                color={cellColor}
                metalness={0.15}
                roughness={0.7}
                emissive={isStartPoint ? '#4a90d9' : taskColor || '#000000'}
                emissiveIntensity={isStartPoint ? 0.4 : task ? 0.25 : 0}
              />
            </mesh>

            {/* 起点装饰：海星标记 + 柔和光源 */}
            {isStartPoint && (
              <>
                <mesh position={[pos[0], pos[1] + 0.2, pos[2]]} rotation={[-Math.PI / 2, 0, index * 0.5]}>
                  <circleGeometry args={[0.25, 5]} />
                  <meshStandardMaterial
                    color="#ff6347"
                    metalness={0.3}
                    roughness={0.5}
                    emissive="#ff6347"
                    emissiveIntensity={0.5}
                    side={THREE.DoubleSide}
                  />
                </mesh>
                <pointLight
                  position={[pos[0], pos[1] + 1.2, pos[2]]}
                  intensity={0.4}
                  distance={4}
                  color="#4a90d9"
                />
              </>
            )}

            {/* 任务图标标记 */}
            {task && (
              <Html
                position={[pos[0], pos[1] + 0.6, pos[2]]}
                center
                distanceFactor={15}
                style={{ pointerEvents: 'none' }}
              >
                <div
                  style={{
                    fontSize: '14px',
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.45)',
                    border: `1.5px solid ${taskColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 'bold',
                    userSelect: 'none',
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                  }}
                  title={task.title}
                >
                  {TASK_TYPE_ICONS[task.type]}
                </div>
              </Html>
            )}

            {/* 底部沙地印记 */}
            <mesh position={[pos[0], pos[1] - 0.02, pos[2]]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.55, 24]} />
              <meshStandardMaterial
                color="#d2b48c"
                transparent
                opacity={0.5}
                roughness={0.95}
                metalness={0.0}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};
