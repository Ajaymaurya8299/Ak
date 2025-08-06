import { useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { TextureLoader } from "three";
import * as THREE from "three";
import { useAviatorGame } from "../../lib/stores/useAviatorGame";

export function Background() {
  const { phase } = useAviatorGame();
  
  return (
    <group>
      {/* Sky background */}
      <Sky />
      
      {/* Ground */}
      <Ground />
      
      {/* Clouds */}
      <Clouds />
      
      {/* Buildings/cityscape */}
      <Cityscape />
    </group>
  );
}

function Sky() {
  const skyTexture = useLoader(TextureLoader, "/textures/sky.png");
  
  return (
    <mesh position={[0, 0, -20]} scale={[50, 30, 1]}>
      <planeGeometry />
      <meshBasicMaterial map={skyTexture} />
    </mesh>
  );
}

function Ground() {
  const grassTexture = useLoader(TextureLoader, "/textures/grass.png");
  grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
  grassTexture.repeat.set(10, 10);
  
  return (
    <mesh position={[0, -5, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <meshLambertMaterial map={grassTexture} />
    </mesh>
  );
}

function Clouds() {
  const cloudPositions = [
    [-15, 8, -10],
    [12, 6, -15],
    [-8, 10, -8],
    [20, 7, -12],
    [-25, 9, -18],
    [8, 11, -6]
  ];
  
  return (
    <group>
      {cloudPositions.map((pos, index) => (
        <Cloud key={index} position={pos as [number, number, number]} />
      ))}
    </group>
  );
}

function Cloud({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    
    // Slow floating animation
    meshRef.current.position.x += 0.01;
    meshRef.current.position.y += Math.sin(state.clock.elapsedTime + position[0]) * 0.002;
    
    // Reset position if cloud moves too far
    if (meshRef.current.position.x > 30) {
      meshRef.current.position.x = -30;
    }
  });
  
  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[2, 8, 6]} />
      <meshLambertMaterial color="#ffffff" transparent opacity={0.8} />
      
      {/* Additional cloud puffs */}
      <mesh position={[1.5, 0.5, 0]}>
        <sphereGeometry args={[1.5, 8, 6]} />
        <meshLambertMaterial color="#ffffff" transparent opacity={0.7} />
      </mesh>
      <mesh position={[-1.2, 0.3, 0.5]}>
        <sphereGeometry args={[1.2, 8, 6]} />
        <meshLambertMaterial color="#ffffff" transparent opacity={0.6} />
      </mesh>
    </mesh>
  );
}

function Cityscape() {
  const buildingPositions = [
    [-30, -2, -25],
    [-25, -1.5, -28],
    [-20, -2.5, -22],
    [-15, -2, -30],
    [15, -2, -25],
    [20, -1.5, -28],
    [25, -2.5, -22],
    [30, -2, -26]
  ];
  
  return (
    <group>
      {buildingPositions.map((pos, index) => (
        <Building 
          key={index} 
          position={pos as [number, number, number]}
          height={Math.random() * 3 + 2}
        />
      ))}
    </group>
  );
}

function Building({ position, height }: { position: [number, number, number]; height: number }) {
  const windowLights = Math.random() > 0.3; // 70% chance of lit windows
  
  return (
    <mesh position={position} castShadow>
      <boxGeometry args={[2, height, 2]} />
      <meshLambertMaterial color={windowLights ? "#4a5568" : "#2d3748"} />
      
      {/* Windows */}
      {windowLights && (
        <>
          <mesh position={[0, height / 4, 1.01]}>
            <planeGeometry args={[0.3, 0.3]} />
            <meshBasicMaterial color="#ffeb3b" />
          </mesh>
          <mesh position={[0.5, height / 4, 1.01]}>
            <planeGeometry args={[0.3, 0.3]} />
            <meshBasicMaterial color="#ffeb3b" />
          </mesh>
          <mesh position={[-0.5, height / 4, 1.01]}>
            <planeGeometry args={[0.3, 0.3]} />
            <meshBasicMaterial color="#ffeb3b" />
          </mesh>
        </>
      )}
    </mesh>
  );
}
