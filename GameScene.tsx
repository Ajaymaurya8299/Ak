import { useFrame } from "@react-three/fiber";
import { useRef, useEffect } from "react";
import * as THREE from "three";
import { Plane } from "./Plane";
import { Background } from "./Background";
import { CrashEffect } from "./CrashEffect";
import { PlaneTrail } from "./PlaneTrail";
import { Atmosphere } from "./VisualEffects";
import { useAviatorGame } from "../../lib/stores/useAviatorGame";
import { calculateMultiplier } from "../../lib/gameLogic";

export function GameScene() {
  const timeRef = useRef(0);
  const { phase, updateMultiplier, startNewRound } = useAviatorGame();

  // Start the first round when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      if (phase === "waiting") {
        startNewRound();
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [phase, startNewRound]);

  useFrame((state, delta) => {
    // Only update during flying phase
    if (phase === "flying") {
      timeRef.current += delta;
      const currentMultiplier = calculateMultiplier(timeRef.current);
      updateMultiplier(currentMultiplier, timeRef.current);
    } else if (phase === "preparing" || phase === "waiting") {
      // Reset timer for new round
      timeRef.current = 0;
    }
  });

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      
      {/* Game objects */}
      <Background />
      <Atmosphere />
      <PlaneTrail />
      <Plane />
      <CrashEffect />
      
      {/* Camera animation */}
      <CameraController />
    </>
  );
}

function CameraController() {
  const { phase, currentMultiplier } = useAviatorGame();
  const shakeRef = useRef({ x: 0, y: 0, z: 0 });
  const basePositionRef = useRef({ x: 0, y: 5, z: 10 });
  
  useFrame((state) => {
    const camera = state.camera;
    
    if (phase === "flying") {
      // Camera follows the plane's ascent
      const targetY = 5 + Math.log(currentMultiplier) * 2;
      basePositionRef.current.y = THREE.MathUtils.lerp(basePositionRef.current.y, targetY, 0.02);
      
      // Add subtle shake during high multipliers
      if (currentMultiplier > 5) {
        const intensity = Math.min((currentMultiplier - 5) / 10, 1) * 0.1;
        shakeRef.current.x = (Math.random() - 0.5) * intensity;
        shakeRef.current.y = (Math.random() - 0.5) * intensity;
        shakeRef.current.z = (Math.random() - 0.5) * intensity;
      } else {
        shakeRef.current.x *= 0.8;
        shakeRef.current.y *= 0.8;
        shakeRef.current.z *= 0.8;
      }
      
      // Apply position with shake
      camera.position.set(
        basePositionRef.current.x + shakeRef.current.x,
        basePositionRef.current.y + shakeRef.current.y,
        basePositionRef.current.z + shakeRef.current.z
      );
      
      // Look slightly ahead of the plane
      camera.lookAt(0, targetY - 2, 0);
    } else if (phase === "crashed") {
      // Intense shake during crash
      const crashShake = 0.5;
      shakeRef.current.x = (Math.random() - 0.5) * crashShake;
      shakeRef.current.y = (Math.random() - 0.5) * crashShake;
      shakeRef.current.z = (Math.random() - 0.5) * crashShake;
      
      camera.position.set(
        basePositionRef.current.x + shakeRef.current.x,
        basePositionRef.current.y + shakeRef.current.y,
        basePositionRef.current.z + shakeRef.current.z
      );
    } else {
      // Return to starting position
      basePositionRef.current.x = THREE.MathUtils.lerp(basePositionRef.current.x, 0, 0.05);
      basePositionRef.current.y = THREE.MathUtils.lerp(basePositionRef.current.y, 5, 0.05);
      basePositionRef.current.z = THREE.MathUtils.lerp(basePositionRef.current.z, 10, 0.05);
      
      // Reduce shake
      shakeRef.current.x *= 0.9;
      shakeRef.current.y *= 0.9;
      shakeRef.current.z *= 0.9;
      
      camera.position.set(
        basePositionRef.current.x + shakeRef.current.x,
        basePositionRef.current.y + shakeRef.current.y,
        basePositionRef.current.z + shakeRef.current.z
      );
      camera.lookAt(0, 0, 0);
    }
  });
  
  return null;
}
