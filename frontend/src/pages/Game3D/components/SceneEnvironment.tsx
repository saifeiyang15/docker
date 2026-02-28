import React, { useRef, useMemo, useEffect } from 'react';
import { useThree, useLoader } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import * as THREE from 'three';
import { Lensflare, LensflareElement } from 'three/examples/jsm/objects/Lensflare';

/**
 * 海滩日落氛围环境：温暖的天空、柔和的阳光，
 * 使用 lensflare 图片营造真实的太阳光晕效果。
 */
export const SceneEnvironment: React.FC = () => {
  const { gl, scene } = useThree();
  const skyRef = useRef<any>(null);
  const lensflareAddedRef = useRef(false);

  const sunPosition = useMemo(() => {
    const phi = THREE.MathUtils.degToRad(75);
    const theta = THREE.MathUtils.degToRad(200);
    const sunVec = new THREE.Vector3();
    sunVec.setFromSphericalCoords(1, phi, theta);
    return [sunVec.x * 1000, sunVec.y * 1000, sunVec.z * 1000] as [number, number, number];
  }, []);

  const lensflareTexture0 = useLoader(THREE.TextureLoader, require('../images/lensflare0.png')) as THREE.Texture;
  const lensflareTexture1 = useLoader(THREE.TextureLoader, require('../images/lensflare1.png')) as THREE.Texture;

  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 0.6;
  }, [gl]);

  useEffect(() => {
    if (skyRef.current) {
      const pmremGenerator = new THREE.PMREMGenerator(gl);
      pmremGenerator.compileEquirectangularShader();
      const skyScene = new THREE.Scene();
      skyScene.add(skyRef.current.clone());
      const envMap = pmremGenerator.fromScene(skyScene, 0, 0.1, 1000);
      scene.environment = envMap.texture;
      pmremGenerator.dispose();
    }
  }, [gl, scene]);

  useEffect(() => {
    if (lensflareAddedRef.current) return;
    lensflareAddedRef.current = true;

    const lensflare = new Lensflare();
    lensflare.addElement(new LensflareElement(lensflareTexture0, 700, 0, new THREE.Color(0xffffff)));
    lensflare.addElement(new LensflareElement(lensflareTexture1, 60, 0.6));
    lensflare.addElement(new LensflareElement(lensflareTexture1, 70, 0.7));
    lensflare.addElement(new LensflareElement(lensflareTexture1, 120, 0.9));
    lensflare.addElement(new LensflareElement(lensflareTexture1, 70, 1.0));

    const sunLight = new THREE.PointLight(0xfff5e0, 1.0, 2000);
    sunLight.position.set(sunPosition[0] * 0.05, sunPosition[1] * 0.05, sunPosition[2] * 0.05);
    sunLight.add(lensflare);
    scene.add(sunLight);

    return () => {
      scene.remove(sunLight);
      lensflare.dispose();
      sunLight.dispose();
    };
  }, [scene, sunPosition, lensflareTexture0, lensflareTexture1]);

  return (
    <>
      {/* 热带海滩天空 */}
      <Sky
        ref={skyRef}
        sunPosition={sunPosition}
        turbidity={10}
        rayleigh={2.5}
        mieCoefficient={0.005}
        mieDirectionalG={0.85}
      />

      {/* 环境光 - 温暖的海滩氛围 */}
      <ambientLight intensity={0.9} color="#fff8f0" />

      {/* 主方向光 - 温暖的阳光 */}
      <directionalLight
        position={[-30, 52.5, 30]}
        intensity={1.2}
        color="#fff0d0"
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-far={120}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />

      {/* 补光 - 来自海面的反射光 */}
      <directionalLight
        position={[20, 10, -30]}
        intensity={0.3}
        color="#87ceeb"
      />

      {/* 沙滩区域暖色补光 */}
      <pointLight
        position={[0, 8, 0]}
        intensity={0.4}
        distance={30}
        color="#ffe4b5"
      />
    </>
  );
};
