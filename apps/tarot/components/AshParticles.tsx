import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AshParticlesProps {
  isActive: boolean;
  position: THREE.Vector3;
  onComplete: () => void;
}

export const AshParticles: React.FC<AshParticlesProps> = ({ isActive, position, onComplete }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 1500;

  const [positions, velocities, lifetimes] = React.useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const life = new Float32Array(count);
    return [pos, vel, life];
  }, []);

  const resetParticles = () => {
    if (!pointsRef.current) return;

    for (let i = 0; i < count; i++) {
      positions[i * 3] = position.x + (Math.random() - 0.5) * 1.2;
      positions[i * 3 + 1] = position.y + (Math.random() - 0.5) * 2.0;
      positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * 0.1;

      velocities[i * 3] = (Math.random() - 0.5) * 0.05;
      velocities[i * 3 + 1] = Math.random() * 0.1 + 0.02;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.05;

      lifetimes[i] = Math.random() * 1.0 + 0.5;
    }

    pointsRef.current.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  };

  useEffect(() => {
    if (isActive) {
      resetParticles();
    }
  }, [isActive, position]);

  useFrame((state, delta) => {
    if (!isActive || !pointsRef.current) return;

    const positionsAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    let activeParticles = 0;

    for (let i = 0; i < count; i++) {
      if (lifetimes[i] > 0) {
        lifetimes[i] -= delta;

        const time = state.clock.elapsedTime;
        const noiseX = Math.sin(time * 2 + i) * 0.002;

        positions[i * 3] += velocities[i * 3] + noiseX;
        positions[i * 3 + 1] += velocities[i * 3 + 1];
        positions[i * 3 + 2] += velocities[i * 3 + 2];

        activeParticles++;
      } else {
        positions[i * 3 + 1] = 1000;
      }
    }

    positionsAttr.needsUpdate = true;

    if (activeParticles === 0) {
      onComplete();
    }
  });

  if (!isActive) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#d4af37"
        size={0.03}
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};
