import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect } from "react";
import "@fontsource/inter";
import { GameScene } from "./components/game/GameScene";
import { AviatorUI } from "./components/game/AviatorUI";
import { SoundManager } from "./components/game/SoundManager";
import { GameEffects } from "./components/game/GameEffects";
import { LoginPage } from "./components/auth/LoginPage";
import { PWAInstallPrompt } from "./components/ui/PWAInstallPrompt";
import { MobileOptimizations } from "./components/ui/MobileOptimizations";
import { useAviatorGame } from "./lib/stores/useAviatorGame";
import { useAuthStore } from "./lib/stores/useAuth";
import { syncGameBalanceFromAuth, setupBalanceSync } from "./lib/stores/syncStores";

function App() {
  const { initializeGame } = useAviatorGame();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      initializeGame();
      syncGameBalanceFromAuth();
      setupBalanceSync();
    }
  }, [initializeGame, isAuthenticated]);

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="w-full h-screen relative overflow-hidden">
      {/* New Aviator-style UI */}
      <AviatorUI />

      {/* Hidden 3D Scene for game logic */}
      <div className="absolute inset-0 opacity-0 pointer-events-none">
        <Canvas
          camera={{
            position: [0, 5, 10],
            fov: 60,
            near: 0.1,
            far: 1000
          }}
          gl={{
            antialias: true,
            powerPreference: "high-performance"
          }}
        >
          <Suspense fallback={null}>
            <GameScene />
          </Suspense>
        </Canvas>
      </div>

      {/* Sound Manager */}
      <SoundManager />
      
      {/* Game Effects */}
      <GameEffects />
      
      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
      
      {/* Mobile Optimizations */}
      <MobileOptimizations />
    </div>
  );
}

export default App;
