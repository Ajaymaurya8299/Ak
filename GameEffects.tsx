import { useEffect } from "react";
import { useAviatorGame } from "../../lib/stores/useAviatorGame";
import { useAudio } from "../../lib/stores/useAudio";

// Screen flash and vibration effects
export function GameEffects() {
  const { phase, currentMultiplier } = useAviatorGame();
  const { playHit, playSuccess } = useAudio();

  useEffect(() => {
    if (phase === "crashed") {
      // Screen flash effect
      const flashOverlay = document.createElement('div');
      flashOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: radial-gradient(circle, rgba(255,0,0,0.8) 0%, rgba(255,100,0,0.4) 50%, transparent 100%);
        pointer-events: none;
        z-index: 9999;
        animation: crash-flash 0.5s ease-out forwards;
      `;
      
      // Add CSS animation
      const style = document.createElement('style');
      style.textContent = `
        @keyframes crash-flash {
          0% { opacity: 1; transform: scale(0.8); }
          100% { opacity: 0; transform: scale(1.2); }
        }
      `;
      document.head.appendChild(style);
      document.body.appendChild(flashOverlay);
      
      // Mobile vibration
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
      
      // Clean up after animation
      setTimeout(() => {
        document.body.removeChild(flashOverlay);
        document.head.removeChild(style);
      }, 500);
    }
  }, [phase]);

  useEffect(() => {
    // High multiplier effects
    if (phase === "flying" && currentMultiplier > 10) {
      const intensity = Math.min((currentMultiplier - 10) / 20, 1);
      
      // Create pulsing glow effect
      const glowOverlay = document.getElementById('multiplier-glow') || document.createElement('div');
      glowOverlay.id = 'multiplier-glow';
      glowOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: radial-gradient(circle, rgba(255,215,0,${intensity * 0.1}) 0%, transparent 70%);
        pointer-events: none;
        z-index: 1000;
        animation: pulse-glow 2s ease-in-out infinite;
      `;
      
      const style = document.getElementById('glow-style') || document.createElement('style');
      style.id = 'glow-style';
      style.textContent = `
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `;
      
      if (!document.head.contains(style)) {
        document.head.appendChild(style);
      }
      if (!document.body.contains(glowOverlay)) {
        document.body.appendChild(glowOverlay);
      }
    } else {
      // Remove glow when multiplier is low
      const glowOverlay = document.getElementById('multiplier-glow');
      if (glowOverlay) {
        document.body.removeChild(glowOverlay);
      }
    }
  }, [phase, currentMultiplier]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      const glowOverlay = document.getElementById('multiplier-glow');
      const glowStyle = document.getElementById('glow-style');
      if (glowOverlay) document.body.removeChild(glowOverlay);
      if (glowStyle) document.head.removeChild(glowStyle);
    };
  }, []);

  return null; // This component only manages effects, no UI
}