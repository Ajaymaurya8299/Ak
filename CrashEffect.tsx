import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useAviatorGame } from "../../lib/stores/useAviatorGame";

export function CrashEffect() {
  const { phase, currentMultiplier } = useAviatorGame();
  const particlesRef = useRef<THREE.Points>(null);
  const explosionRef = useRef<THREE.Mesh>(null);
  const smokeRef = useRef<THREE.Points>(null);
  
  const particleCount = 100;
  const smokeCount = 50;
  
  // Create explosion particles
  const explosionPositions = new Float32Array(particleCount * 3);
  const explosionVelocities = new Float32Array(particleCount * 3);
  const explosionColors = new Float32Array(particleCount * 3);
  
  // Create smoke particles
  const smokePositions = new Float32Array(smokeCount * 3);
  const smokeVelocities = new Float32Array(smokeCount * 3);
  
  useEffect(() => {
    if (phase === "crashed") {
      // Initialize explosion particles
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        // Start from plane position
        explosionPositions[i3] = 0;
        explosionPositions[i3 + 1] = 0;
        explosionPositions[i3 + 2] = 0;
        
        // Random velocities for explosion effect
        explosionVelocities[i3] = (Math.random() - 0.5) * 10;
        explosionVelocities[i3 + 1] = (Math.random() - 0.5) * 10;
        explosionVelocities[i3 + 2] = (Math.random() - 0.5) * 10;
        
        // Fire colors (red, orange, yellow)
        const colorType = Math.random();
        if (colorType < 0.33) {
          explosionColors[i3] = 1; // Red
          explosionColors[i3 + 1] = 0.2;
          explosionColors[i3 + 2] = 0;
        } else if (colorType < 0.66) {
          explosionColors[i3] = 1; // Orange
          explosionColors[i3 + 1] = 0.5;
          explosionColors[i3 + 2] = 0;
        } else {
          explosionColors[i3] = 1; // Yellow
          explosionColors[i3 + 1] = 1;
          explosionColors[i3 + 2] = 0;
        }
      }
      
      // Initialize smoke particles
      for (let i = 0; i < smokeCount; i++) {
        const i3 = i * 3;
        
        smokePositions[i3] = 0;
        smokePositions[i3 + 1] = 0;
        smokePositions[i3 + 2] = 0;
        
        smokeVelocities[i3] = (Math.random() - 0.5) * 2;
        smokeVelocities[i3 + 1] = Math.random() * 3 + 1; // Upward motion
        smokeVelocities[i3 + 2] = (Math.random() - 0.5) * 2;
      }
    }
  }, [phase]);

  useFrame((state, delta) => {
    if (phase !== "crashed" || !particlesRef.current || !smokeRef.current) return;
    
    // Animate explosion particles
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Update positions based on velocities
      positions[i3] += explosionVelocities[i3] * delta;
      positions[i3 + 1] += explosionVelocities[i3 + 1] * delta;
      positions[i3 + 2] += explosionVelocities[i3 + 2] * delta;
      
      // Apply gravity to explosion particles
      explosionVelocities[i3 + 1] -= 9.8 * delta;
      
      // Add air resistance
      explosionVelocities[i3] *= 0.98;
      explosionVelocities[i3 + 1] *= 0.98;
      explosionVelocities[i3 + 2] *= 0.98;
    }
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
    
    // Animate smoke particles
    const smokePos = smokeRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < smokeCount; i++) {
      const i3 = i * 3;
      
      smokePos[i3] += smokeVelocities[i3] * delta;
      smokePos[i3 + 1] += smokeVelocities[i3 + 1] * delta;
      smokePos[i3 + 2] += smokeVelocities[i3 + 2] * delta;
      
      // Slow down smoke over time
      smokeVelocities[i3] *= 0.95;
      smokeVelocities[i3 + 1] *= 0.95;
      smokeVelocities[i3 + 2] *= 0.95;
    }
    smokeRef.current.geometry.attributes.position.needsUpdate = true;
    
    // Scale explosion sphere
    if (explosionRef.current) {
      const scale = Math.min(state.clock.elapsedTime * 5, 3);
      explosionRef.current.scale.setScalar(scale);
      const material = explosionRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = Math.max(0, 1 - scale / 3);
    }
  });

  if (phase !== "crashed") return null;

  return (
    <group>
      {/* Main explosion sphere */}
      <mesh ref={explosionRef} position={[0, 0, 0]}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial 
          color="#ff4400" 
          transparent 
          opacity={0.8}
        />
      </mesh>
      
      {/* Explosion particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={explosionPositions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={particleCount}
            array={explosionColors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial 
          size={0.1} 
          transparent 
          opacity={0.8}
          vertexColors
          blending={THREE.AdditiveBlending}
        />
      </points>
      
      {/* Smoke particles */}
      <points ref={smokeRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={smokeCount}
            array={smokePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial 
          color="#555555"
          size={0.2} 
          transparent 
          opacity={0.4}
        />
      </points>
    </group>
  );
}