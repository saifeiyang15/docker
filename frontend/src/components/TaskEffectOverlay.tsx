import React, { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';

interface TaskEffectOverlayProps {
  taskType: 'FORWARD' | 'BACKWARD' | 'BONUS' | 'CHALLENGE';
  taskTitle: string;
  onComplete: () => void;
  durationMs?: number;
}

const TaskEffectOverlay: React.FC<TaskEffectOverlayProps> = ({
  taskType,
  taskTitle,
  onComplete,
  durationMs = 3000,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDismiss = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const colorConfig: Record<string, { primary: number; secondary: number; accent: number }> = {
      CHALLENGE: { primary: 0xffd700, secondary: 0xff6b00, accent: 0xffaa00 },
      BONUS: { primary: 0xff69b4, secondary: 0xff1493, accent: 0xff85c2 },
      FORWARD: { primary: 0x00ff88, secondary: 0x00cc66, accent: 0x66ffaa },
      BACKWARD: { primary: 0xff4444, secondary: 0xcc0000, accent: 0xff8888 },
    };

    const colors = colorConfig[taskType] || colorConfig.CHALLENGE;

    interface ParticleInfo {
      mesh: THREE.Mesh;
      velocity: THREE.Vector3;
      rotationSpeed: THREE.Vector3;
      life: number;
      maxLife: number;
    }

    const particles: ParticleInfo[] = [];

    const createHeartGeometry = (): THREE.ShapeGeometry => {
      const shape = new THREE.Shape();
      const scale = 0.15;
      shape.moveTo(0 * scale, 5 * scale);
      shape.bezierCurveTo(0 * scale, 5 * scale, -5 * scale, 10 * scale, -10 * scale, 5 * scale);
      shape.bezierCurveTo(-15 * scale, -2 * scale, 0 * scale, -10 * scale, 0 * scale, -15 * scale);
      shape.bezierCurveTo(0 * scale, -10 * scale, 15 * scale, -2 * scale, 10 * scale, 5 * scale);
      shape.bezierCurveTo(5 * scale, 10 * scale, 0 * scale, 5 * scale, 0 * scale, 5 * scale);
      return new THREE.ShapeGeometry(shape);
    };

    const createStarGeometry = (): THREE.ShapeGeometry => {
      const shape = new THREE.Shape();
      const outerRadius = 0.8;
      const innerRadius = 0.35;
      const spikes = 5;
      for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i * Math.PI) / spikes - Math.PI / 2;
        const pointX = Math.cos(angle) * radius;
        const pointY = Math.sin(angle) * radius;
        if (i === 0) {
          shape.moveTo(pointX, pointY);
        } else {
          shape.lineTo(pointX, pointY);
        }
      }
      shape.closePath();
      return new THREE.ShapeGeometry(shape);
    };

    const geometries = [
      createHeartGeometry(),
      createStarGeometry(),
      new THREE.SphereGeometry(0.3, 8, 8),
      new THREE.OctahedronGeometry(0.4),
    ];

    const burstCount = 80;
    for (let i = 0; i < burstCount; i++) {
      const geometry = geometries[Math.floor(Math.random() * geometries.length)];
      const colorChoice = [colors.primary, colors.secondary, colors.accent, 0xffffff];
      const material = new THREE.MeshBasicMaterial({
        color: colorChoice[Math.floor(Math.random() * colorChoice.length)],
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(geometry, material);
      const particleScale = 0.5 + Math.random() * 1.5;
      mesh.scale.set(particleScale, particleScale, particleScale);

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = 8 + Math.random() * 15;
      const velocity = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.sin(phi) * Math.sin(theta) * speed,
        Math.cos(phi) * speed * 0.5
      );

      mesh.position.set(0, 0, 0);
      scene.add(mesh);

      particles.push({
        mesh,
        velocity,
        rotationSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.2
        ),
        life: 0,
        maxLife: 60 + Math.random() * 60,
      });
    }

    const ringGeometry = new THREE.RingGeometry(3, 3.3, 64);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: colors.primary,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    scene.add(ring);

    const ring2Geometry = new THREE.RingGeometry(5, 5.2, 64);
    const ring2Material = new THREE.MeshBasicMaterial({
      color: colors.secondary,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    const ring2 = new THREE.Mesh(ring2Geometry, ring2Material);
    scene.add(ring2);

    let animationFrameId: number;
    let frame = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      frame++;

      particles.forEach((particle) => {
        particle.life++;
        const lifeRatio = particle.life / particle.maxLife;

        particle.mesh.position.add(
          particle.velocity.clone().multiplyScalar(0.016)
        );
        particle.velocity.y -= 0.15;
        particle.velocity.multiplyScalar(0.98);

        particle.mesh.rotation.x += particle.rotationSpeed.x;
        particle.mesh.rotation.y += particle.rotationSpeed.y;
        particle.mesh.rotation.z += particle.rotationSpeed.z;

        const material = particle.mesh.material as THREE.MeshBasicMaterial;
        if (lifeRatio > 0.6) {
          material.opacity = Math.max(0, 0.9 * (1 - (lifeRatio - 0.6) / 0.4));
        }
      });

      const ringScale = 1 + frame * 0.02;
      ring.scale.set(ringScale, ringScale, 1);
      ringMaterial.opacity = Math.max(0, 0.8 - frame * 0.008);

      const ring2Scale = 1 + frame * 0.015;
      ring2.scale.set(ring2Scale, ring2Scale, 1);
      ring2Material.opacity = Math.max(0, 0.5 - frame * 0.005);

      ring.rotation.z += 0.02;
      ring2.rotation.z -= 0.015;

      renderer.render(scene, camera);
    };

    animate();

    timerRef.current = setTimeout(handleDismiss, durationMs);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      particles.forEach((particle) => {
        particle.mesh.geometry.dispose();
        (particle.mesh.material as THREE.MeshBasicMaterial).dispose();
      });
      ringGeometry.dispose();
      ringMaterial.dispose();
      ring2Geometry.dispose();
      ring2Material.dispose();
      geometries.forEach((geometry) => geometry.dispose());
    };
  }, [taskType, handleDismiss, durationMs]);

  const overlayColorMap: Record<string, string> = {
    CHALLENGE: 'rgba(255, 165, 0, 0.15)',
    BONUS: 'rgba(255, 105, 180, 0.12)',
    FORWARD: 'rgba(0, 200, 100, 0.12)',
    BACKWARD: 'rgba(255, 50, 50, 0.12)',
  };

  const titleColorMap: Record<string, string> = {
    CHALLENGE: '#FFD700',
    BONUS: '#FF69B4',
    FORWARD: '#00FF88',
    BACKWARD: '#FF4444',
  };

  const getTaskEmoji = (title: string): string => {
    const emojiMapping: Array<{ keywords: string[]; emoji: string }> = [
      { keywords: ['跳舞', '舞蹈', '舞'], emoji: '💃' },
      { keywords: ['唱歌', '歌', '情歌', '对唱', '猜歌'], emoji: '🎤' },
      { keywords: ['拥抱', '抱'], emoji: '🤗' },
      { keywords: ['亲', '吻'], emoji: '💋' },
      { keywords: ['比心', '爱心'], emoji: '❤️' },
      { keywords: ['眼神', '对视'], emoji: '👀' },
      { keywords: ['情话', '表白', '告白', '宣言'], emoji: '💗' },
      { keywords: ['猜', '默契', '心有灵犀'], emoji: '🧠' },
      { keywords: ['模仿', '比划'], emoji: '🎭' },
      { keywords: ['画', '画像'], emoji: '🎨' },
      { keywords: ['按摩'], emoji: '💆' },
      { keywords: ['自拍', '合照'], emoji: '📸' },
      { keywords: ['撒娇'], emoji: '🥺' },
      { keywords: ['情书', '写'], emoji: '📝' },
      { keywords: ['喂食', '零食'], emoji: '🍬' },
      { keywords: ['承诺'], emoji: '💍' },
      { keywords: ['感恩', '感谢'], emoji: '🙏' },
      { keywords: ['回忆', '美好'], emoji: '✨' },
      { keywords: ['许愿', '愿望'], emoji: '🌟' },
      { keywords: ['昵称'], emoji: '💝' },
      { keywords: ['夸', '优点', '可爱'], emoji: '🥰' },
      { keywords: ['牵手'], emoji: '🤝' },
      { keywords: ['真心话'], emoji: '💬' },
      { keywords: ['出发', '开始'], emoji: '🚀' },
      { keywords: ['终点'], emoji: '🏆' },
    ];

    for (const mapping of emojiMapping) {
      if (mapping.keywords.some(keyword => title.includes(keyword))) {
        return mapping.emoji;
      }
    }
    return '🏆';
  };

  const taskEmoji = getTaskEmoji(taskTitle);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: overlayColorMap[taskType] || 'rgba(0,0,0,0.2)',
        cursor: 'pointer',
      }}
      onClick={handleDismiss}
    >
      <div ref={mountRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
          animation: 'taskEffectBounceIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
          pointerEvents: 'none',
        }}
      >
        <div style={{
          fontSize: '80px',
          marginBottom: '16px',
          animation: 'taskEmojiDance 1s ease-in-out infinite',
        }}>
          {taskEmoji}
        </div>
        <h2
          style={{
            fontSize: '36px',
            fontWeight: 800,
            color: titleColorMap[taskType] || '#fff',
            textShadow: '0 2px 20px rgba(0,0,0,0.3), 0 0 40px rgba(255,255,255,0.2)',
            margin: 0,
            letterSpacing: '2px',
          }}
        >
          {taskTitle}
        </h2>
        <p
          style={{
            fontSize: '14px',
            color: 'rgba(255,255,255,0.7)',
            marginTop: '20px',
          }}
        >
          点击任意位置关闭
        </p>
      </div>
      <style>{`
        @keyframes taskEffectBounceIn {
          0% { transform: scale(0.3) translateY(40px); opacity: 0; }
          50% { transform: scale(1.1) translateY(-10px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes taskEmojiDance {
          0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
          20% { transform: translateY(-15px) rotate(-10deg) scale(1.1); }
          40% { transform: translateY(0) rotate(10deg) scale(1); }
          60% { transform: translateY(-10px) rotate(-5deg) scale(1.05); }
          80% { transform: translateY(0) rotate(5deg) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default TaskEffectOverlay;
