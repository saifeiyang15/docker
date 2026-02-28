import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { Water } from 'three/examples/jsm/objects/Water';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { BOARD_CONFIG } from '../constants';

/* ── 彩虹 Shader ── */
const rainbowVertexShader = `
varying vec2 vUV;
varying vec3 vNormal;
void main () {
  vUV = uv;
  vNormal = vec3(normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const rainbowFragmentShader = `
varying vec2 vUV;
varying vec3 vNormal;
void main () {
  vec4 c = vec4(abs(vNormal) + vec3(vUV, 0.0), 0.1);
  gl_FragColor = c;
}
`;

/* ── Ocean 水面组件 ── */
const OceanWater: React.FC = () => {
  const waterRef = useRef<{ current: Water | null }>({ current: null });
  const { scene } = useThree();

  const waterNormalsTexture = useLoader(
    THREE.TextureLoader,
    require('../images/waternormals.jpg')
  ) as THREE.Texture;

  useEffect(() => {
    waterNormalsTexture.wrapS = THREE.RepeatWrapping;
    waterNormalsTexture.wrapT = THREE.RepeatWrapping;
  }, [waterNormalsTexture]);

  const waterObject = useMemo(() => {
    const waterGeometry = new THREE.PlaneGeometry(2000, 2000);
    const water = new Water(waterGeometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: waterNormalsTexture,
      sunDirection: new THREE.Vector3(),
      sunColor: 0xffffff,
      waterColor: 0x006994,
      distortionScale: 3.7,
      fog: false,
    });
    water.rotation.x = -Math.PI / 2;
    water.position.y = -0.5;

    const sunDirection = new THREE.Vector3();
    const phi = THREE.MathUtils.degToRad(85);
    const theta = THREE.MathUtils.degToRad(200);
    sunDirection.setFromSphericalCoords(1, phi, theta);
    water.material.uniforms['sunDirection'].value.copy(sunDirection).normalize();

    return water;
  }, [waterNormalsTexture]);

  useEffect(() => {
    scene.add(waterObject);
    waterRef.current.current = waterObject;
    return () => {
      scene.remove(waterObject);
      waterObject.geometry.dispose();
      (waterObject.material as THREE.Material).dispose();
    };
  }, [waterObject, scene]);

  useFrame(() => {
    if (waterRef.current.current) {
      waterRef.current.current.material.uniforms['time'].value += 1.0 / 60.0;
    }
  });

  return null;
};


/* ── 棕榈树 ── */
const PalmTree: React.FC<{ position: [number, number, number]; scale?: number }> = ({
  position,
  scale = 1,
}) => {
  const trunkRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (trunkRef.current) {
      trunkRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.8) * 0.02;
      trunkRef.current.rotation.z = Math.cos(clock.getElapsedTime() * 0.6) * 0.015;
    }
  });

  return (
    <group position={position} scale={[scale, scale, scale]} ref={trunkRef}>
      {/* 树干 */}
      <mesh position={[0, 2.5, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.25, 5, 8]} />
        <meshStandardMaterial color="#8B4513" roughness={0.9} metalness={0.05} />
      </mesh>
      {/* 树干弯曲段 */}
      <mesh position={[0.2, 4.8, 0]} rotation={[0, 0, 0.15]} castShadow>
        <cylinderGeometry args={[0.12, 0.15, 1.5, 8]} />
        <meshStandardMaterial color="#8B4513" roughness={0.9} metalness={0.05} />
      </mesh>
      {/* 椰子叶 */}
      {[0, 60, 120, 180, 240, 300].map((angleDeg, leafIndex) => {
        const leafAngle = THREE.MathUtils.degToRad(angleDeg);
        return (
          <mesh
            key={`leaf-${leafIndex}`}
            position={[
              Math.cos(leafAngle) * 1.2 + 0.2,
              5.3,
              Math.sin(leafAngle) * 1.2,
            ]}
            rotation={[
              -0.4 + Math.sin(leafAngle) * 0.2,
              leafAngle,
              -0.8,
            ]}
          >
            <planeGeometry args={[2.5, 0.6]} />
            <meshStandardMaterial
              color="#228B22"
              side={THREE.DoubleSide}
              roughness={0.7}
              metalness={0.05}
            />
          </mesh>
        );
      })}
      {/* 椰子 */}
      <mesh position={[0.1, 5.0, 0.15]}>
        <sphereGeometry args={[0.18, 8, 8]} />
        <meshStandardMaterial color="#8B6914" roughness={0.8} />
      </mesh>
      <mesh position={[-0.15, 5.1, -0.1]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial color="#8B6914" roughness={0.8} />
      </mesh>
    </group>
  );
};

/* ── GLTF 岛屿模型（使用 LoadingManager 管理加载进度） ── */
const ISLAND_MODEL_URL = '/models/island.glb';

const IslandModel: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!groupRef.current) return;

    const parentGroup = groupRef.current;
    let disposed = false;

    const manager = new THREE.LoadingManager();
    manager.onProgress = (_url, loaded, total) => {
      const progress = Math.floor((loaded / total) * 100);
      console.log(`🏝️ 岛屿模型加载进度: ${progress}%`);
    };
    manager.onError = (url) => {
      console.error('岛屿模型加载失败:', url);
    };

    const loader = new GLTFLoader(manager);
    loader.load(ISLAND_MODEL_URL, (gltf) => {
      if (disposed) return;

      const islandScene = gltf.scene;

      islandScene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          if (mesh.material) {
            const material = mesh.material as THREE.MeshStandardMaterial;
            material.metalness = 0.4;
            material.roughness = 0.6;
          }
        }
      });

      /* 岛屿作为棋盘基础地形，调整位置让棋格路径贴合岛屿表面 */
      islandScene.position.set(0, -0.8, 0);
      islandScene.scale.set(38, 38, 38);

      parentGroup.add(islandScene);
    });

    return () => {
      disposed = true;
      while (parentGroup.children.length > 0) {
        const child = parentGroup.children[0];
        parentGroup.remove(child);
        child.traverse((node) => {
          if ((node as THREE.Mesh).isMesh) {
            const mesh = node as THREE.Mesh;
            mesh.geometry?.dispose();
            if (mesh.material) {
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach((mat) => mat.dispose());
              } else {
                mesh.material.dispose();
              }
            }
          }
        });
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <group ref={groupRef} />;
};

/* ── 彩虹环 ── */
const RainbowRing: React.FC = () => {
  const rainbowMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      transparent: true,
      vertexShader: rainbowVertexShader,
      fragmentShader: rainbowFragmentShader,
      uniforms: {},
    });
  }, []);

  return (
    <mesh position={[0, 8, -100]} material={rainbowMaterial}>
      <torusGeometry args={[50, 2.5, 50, 100]} />
    </mesh>
  );
};

/* ── 飞鸟（GLTF 模型 + 动画） ── */

/** 三种鸟模型来自 Three.js 官网 */
const BIRD_MODEL_URLS = [
  'https://threejs.org/examples/models/gltf/Parrot.glb',
  'https://threejs.org/examples/models/gltf/Flamingo.glb',
  'https://threejs.org/examples/models/gltf/Stork.glb',
];

interface BirdInstance {
  model: THREE.Object3D;
  mixer: THREE.AnimationMixer;
  speed: number;
  radius: number;
  angle: number;
  heightOffset: number;
  phaseOffset: number;
}

const FlyingBirds: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const birdsRef = useRef<BirdInstance[]>([]);
  const clockRef = useRef(new THREE.Clock());

  useEffect(() => {
    if (!groupRef.current) return;

    const loader = new GLTFLoader();
    const parentGroup = groupRef.current;
    let disposed = false;

    const birdConfigs = [
      { url: BIRD_MODEL_URLS[0], count: 3, scale: 0.06 },
      { url: BIRD_MODEL_URLS[1], count: 3, scale: 0.04 },
      { url: BIRD_MODEL_URLS[2], count: 2, scale: 0.05 },
    ];

    let totalIndex = 0;
    const totalBirds = birdConfigs.reduce((sum, config) => sum + config.count, 0);

    birdConfigs.forEach(({ url, count, scale }) => {
      loader.load(url, (gltf) => {
        if (disposed) return;

        const originalModel = gltf.scene;
        const originalClips = gltf.animations;

        for (let i = 0; i < count; i++) {
          const clonedModel = originalModel.clone();
          clonedModel.scale.set(scale, scale, scale);

          clonedModel.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.castShadow = true;
              if (mesh.material) {
                mesh.material = (mesh.material as THREE.Material).clone();
              }
            }
          });

          const radius = 30 + Math.random() * 45;
          const angle = (Math.PI * 2 * totalIndex) / totalBirds + Math.random() * 0.4;
          const heightOffset = 12 + Math.random() * 18;
          const phaseOffset = Math.random() * Math.PI * 2;

          clonedModel.position.set(
            Math.cos(angle) * radius,
            heightOffset,
            Math.sin(angle) * radius
          );

          parentGroup.add(clonedModel);

          const mixer = new THREE.AnimationMixer(clonedModel);
          if (originalClips.length > 0) {
            const clip = originalClips[0];
            const action = mixer.clipAction(clip);
            action.timeScale = 0.8 + Math.random() * 0.4;
            action.play();
          }

          birdsRef.current.push({
            model: clonedModel,
            mixer,
            speed: 0.001 + Math.random() * 0.003,
            radius,
            angle,
            heightOffset,
            phaseOffset,
          });

          totalIndex++;
        }
      });
    });

    clockRef.current.start();

    return () => {
      disposed = true;
      birdsRef.current.forEach((bird) => {
        bird.mixer.stopAllAction();
        parentGroup.remove(bird.model);
        bird.model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.geometry?.dispose();
            if (mesh.material) {
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach((mat) => mat.dispose());
              } else {
                mesh.material.dispose();
              }
            }
          }
        });
      });
      birdsRef.current = [];
    };
  }, []);

  useFrame(() => {
    const delta = clockRef.current.getDelta();
    const elapsed = clockRef.current.getElapsedTime();

    birdsRef.current.forEach((bird) => {
      bird.mixer.update(delta);

      bird.angle += bird.speed;
      const posX = Math.cos(bird.angle) * bird.radius;
      const posZ = Math.sin(bird.angle) * bird.radius;
      const posY = bird.heightOffset + Math.sin(elapsed * 1.2 + bird.phaseOffset) * 2.5;

      bird.model.position.set(posX, posY, posZ);

      const nextAngle = bird.angle + 0.02;
      const nextX = Math.cos(nextAngle) * bird.radius;
      const nextZ = Math.sin(nextAngle) * bird.radius;
      bird.model.lookAt(nextX, posY, nextZ);
    });
  });

  return <group ref={groupRef} />;
};

/* ── 海面光斑粒子 ── */
const OceanSparkles: React.FC = () => {
  const sparklesRef = useRef<THREE.Points>(null);

  const sparkleData = useMemo(() => {
    const count = 600;
    const positions = new Float32Array(count * 3);
    const islandR = BOARD_CONFIG.islandRadius;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = islandR + 5 + Math.random() * 80;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = -0.3 + Math.random() * 0.3;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }

    return { positions };
  }, []);

  useFrame(({ clock }) => {
    if (sparklesRef.current) {
      const positions = sparklesRef.current.geometry.attributes.position.array as Float32Array;
      const elapsed = clock.getElapsedTime();

      for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3 + 1] = -0.3 + Math.sin(elapsed * 2 + i * 0.1) * 0.25;
      }

      sparklesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={sparklesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={sparkleData.positions.length / 3}
          array={sparkleData.positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.4}
        color="#ffffff"
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};


/* ── 主背景场景组件 ── */
const BackgroundScene: React.FC = () => {
  return (
    <group>
      {/* Ocean 水面 */}
      <OceanWater />

      {/* GLTF 岛屿模型（作为棋盘基础地形） */}
      <IslandModel />

      {/* 棕榈树装饰（直接放置在岛屿上） */}
      <PalmTree position={[-14, 0.5, -10]} scale={1.2} />
      <PalmTree position={[14, 0.5, -8]} scale={0.9} />
      <PalmTree position={[-13, 0.5, 11]} scale={1.0} />
      <PalmTree position={[15, 0.5, 9]} scale={1.1} />
      <PalmTree position={[0, 0.5, -16]} scale={0.8} />

      {/* 远处彩虹 */}
      <RainbowRing />

      {/* 飞鸟 */}
      <FlyingBirds />

      {/* 海面光斑 */}
      <OceanSparkles />
    </group>
  );
};

export default BackgroundScene;
