import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const ThreeBackground: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 50;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const createHeartShape = (): THREE.Shape => {
      const heartShape = new THREE.Shape();
      const scale = 0.3;
      heartShape.moveTo(0 * scale, 5 * scale);
      heartShape.bezierCurveTo(0 * scale, 5 * scale, -5 * scale, 10 * scale, -10 * scale, 5 * scale);
      heartShape.bezierCurveTo(-15 * scale, -2 * scale, 0 * scale, -10 * scale, 0 * scale, -15 * scale);
      heartShape.bezierCurveTo(0 * scale, -10 * scale, 15 * scale, -2 * scale, 10 * scale, 5 * scale);
      heartShape.bezierCurveTo(5 * scale, 10 * scale, 0 * scale, 5 * scale, 0 * scale, 5 * scale);
      return heartShape;
    };

    const heartGeometry = new THREE.ShapeGeometry(createHeartShape());
    const starGeometry = new THREE.SphereGeometry(0.15, 8, 8);

    const heartColors = [
      new THREE.Color(0xff6b9d),
      new THREE.Color(0xff85a2),
      new THREE.Color(0xffa0b8),
      new THREE.Color(0xe91e8c),
      new THREE.Color(0xff4081),
    ];

    const starColors = [
      new THREE.Color(0xffd700),
      new THREE.Color(0xfff0b3),
      new THREE.Color(0xffe0e0),
      new THREE.Color(0xb3e5fc),
    ];

    interface ParticleData {
      mesh: THREE.Mesh;
      speedY: number;
      speedX: number;
      rotationSpeed: number;
      amplitude: number;
      phase: number;
    }

    const particles: ParticleData[] = [];
    const particleCount = 35;

    for (let i = 0; i < particleCount; i++) {
      const isHeart = i < 20;
      const geometry = isHeart ? heartGeometry.clone() : starGeometry.clone();
      const colorArray = isHeart ? heartColors : starColors;
      const color = colorArray[Math.floor(Math.random() * colorArray.length)];

      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.15 + Math.random() * 0.35,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(geometry, material);
      const spreadX = 80;
      const spreadY = 60;
      mesh.position.set(
        (Math.random() - 0.5) * spreadX,
        (Math.random() - 0.5) * spreadY,
        (Math.random() - 0.5) * 30
      );

      const particleScale = isHeart ? 0.5 + Math.random() * 1.2 : 0.8 + Math.random() * 1.5;
      mesh.scale.set(particleScale, particleScale, particleScale);
      mesh.rotation.z = Math.random() * Math.PI * 2;

      scene.add(mesh);

      particles.push({
        mesh,
        speedY: 0.01 + Math.random() * 0.03,
        speedX: (Math.random() - 0.5) * 0.01,
        rotationSpeed: (Math.random() - 0.5) * 0.005,
        amplitude: 0.5 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2,
      });
    }

    let animationFrameId: number;
    let time = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      time += 0.01;

      particles.forEach((particle) => {
        particle.mesh.position.y += particle.speedY;
        particle.mesh.position.x += Math.sin(time + particle.phase) * particle.speedX;
        particle.mesh.rotation.z += particle.rotationSpeed;

        const floatOffset = Math.sin(time * 0.5 + particle.phase) * particle.amplitude * 0.02;
        particle.mesh.position.x += floatOffset;

        if (particle.mesh.position.y > 35) {
          particle.mesh.position.y = -35;
          particle.mesh.position.x = (Math.random() - 0.5) * 80;
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      particles.forEach((particle) => {
        particle.mesh.geometry.dispose();
        (particle.mesh.material as THREE.MeshBasicMaterial).dispose();
      });
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
};

export default ThreeBackground;
