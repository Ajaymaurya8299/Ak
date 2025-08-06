import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useAviatorGame } from "../../lib/stores/useAviatorGame";

export function PlaneTrail() {
  const { phase, timeElapsed } = useAviatorGame();
  const trailRef = useRef<THREE.Line>(null);
  const trailPositions = useRef<THREE.Vector3[]>([]);
  const maxTrailLength = 50;

  // Create trail geometry
  const trailGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(maxTrailLength * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, []);

  useFrame(() => {
    if (!trailRef.current || phase !== "flying") return;

    // Calculate current plane position (same as in gameLogic.ts)
    const x = Math.sin(timeElapsed * 0.5) * 2;
    const y = Math.log(Math.max(1, timeElapsed * 0.1 + 1)) * 2;
    const z = timeElapsed * 2;

    // Add current position to trail
    trailPositions.current.push(new THREE.Vector3(x, y, z));
    
    // Remove old positions to maintain trail length
    if (trailPositions.current.length > maxTrailLength) {
      trailPositions.current.shift();
    }

    // Update geometry positions
    const positions = trailRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < trailPositions.current.length; i++) {
      const pos = trailPositions.current[i];
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;
    }

    // Clear remaining positions
    for (let i = trailPositions.current.length; i < maxTrailLength; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
    }

    trailRef.current.geometry.attributes.position.needsUpdate = true;
    trailRef.current.geometry.setDrawRange(0, trailPositions.current.length);
  });

  // Clear trail when not flying
  if (phase !== "flying") {
    trailPositions.current = [];
    return null;
  }

  return (
    <primitive object={new THREE.Line(trailGeometry, new THREE.LineBasicMaterial({
      color: "#00aaff",
      transparent: true,
      opacity: 0.6
    }))} ref={trailRef} />
  );
}

// Enhanced engine particles with better performance
export function EnhancedEngineParticles() {
  const particlesRef = useRef<THREE.Points>(null);
  const { phase } = useAviatorGame();
  
  const particleCount = 30;
  
  // Create particle geometry
  const { positions, velocities } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Initial positions
      positions[i3] = (Math.random() - 0.5) * 0.2;
      positions[i3 + 1] = (Math.random() - 0.5) * 0.2;
      positions[i3 + 2] = 0;
      
      // Initial velocities (backward from engine)
      velocities[i3] = (Math.random() - 0.5) * 0.1;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.1;
      velocities[i3 + 2] = -Math.random() * 2 - 1;
    }
    
    return { positions, velocities };
  }, []);

  useFrame((state, delta) => {
    if (!particlesRef.current || phase !== "flying") return;
    
    const posArray = particlesRef.current.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Update positions
      posArray[i3] += velocities[i3] * delta;
      posArray[i3 + 1] += velocities[i3 + 1] * delta;
      posArray[i3 + 2] += velocities[i3 + 2] * delta;
      
      // Reset particles that have moved too far
      if (posArray[i3 + 2] < -5) {
        posArray[i3] = (Math.random() - 0.5) * 0.2;
        posArray[i3 + 1] = (Math.random() - 0.5) * 0.2;
        posArray[i3 + 2] = 0;
        
        velocities[i3] = (Math.random() - 0.5) * 0.1;
        velocities[i3 + 1] = (Math.random() - 0.5) * 0.1;
        velocities[i3 + 2] = -Math.random() * 2 - 1;
      }
      
      // Apply some turbulence
      velocities[i3] += (Math.random() - 0.5) * 0.01;
      velocities[i3 + 1] += (Math.random() - 0.5) * 0.01;
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  if (phase !== "flying") return null;

  return (
    <points ref={particlesRef} position={[0, 0, -1.5]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial 
        color="#ff8800" 
        size={0.08} 
        transparent 
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}