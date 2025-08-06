import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { calculateCrashPoint, generateGameId } from "../gameLogic";

export type GamePhase = "waiting" | "flying" | "crashed" | "preparing";

interface GameRound {
  id: string;
  crashPoint: number;
  finalMultiplier: number;
  timestamp: number;
}

interface Bet {
  id: string;
  amount: number;
  cashOutMultiplier?: number;
  profit: number;
  active: boolean;
}

interface AviatorGameState {
  // Game state
  phase: GamePhase;
  currentMultiplier: number;
  crashPoint: number;
  gameId: string;
  timeElapsed: number;
  
  // Player state
  balance: number;
  currentBet: Bet | null;
  betAmount: number;
  
  // History
  gameHistory: GameRound[];
  
  // UI state
  isAutoPlay: boolean;
  autoCashOut: number | null;
  
  // Actions
  initializeGame: () => void;
  startNewRound: () => void;
  updateMultiplier: (multiplier: number, elapsed: number) => void;
  crashGame: () => void;
  placeBet: (amount: number) => void;
  cashOut: () => void;
  setBalance: (balance: number) => void;
  setBetAmount: (amount: number) => void;
  setAutoPlay: (enabled: boolean) => void;
  setAutoCashOut: (multiplier: number | null) => void;
}

export const useAviatorGame = create<AviatorGameState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    phase: "waiting",
    currentMultiplier: 1.0,
    crashPoint: 0,
    gameId: "",
    timeElapsed: 0,
    balance: 1000, // Starting balance
    currentBet: null,
    betAmount: 10,
    gameHistory: [],
    isAutoPlay: false,
    autoCashOut: null,

    initializeGame: () => {
      console.log("Initializing Aviator game");
      set({
        phase: "waiting",
        currentMultiplier: 1.0,
        timeElapsed: 0,
        gameId: generateGameId(),
        balance: 1000 // Will be synced from auth store separately
      });
    },

    startNewRound: () => {
      const { balance, betAmount, currentBet, isAutoPlay } = get();
      
      console.log("Starting new round", { balance, betAmount, hasActiveBet: !!currentBet });
      
      const crashPoint = calculateCrashPoint();
      const gameId = generateGameId();
      
      // Auto-place bet if auto-play is enabled and player has sufficient balance
      let newBet: Bet | null = null;
      if (isAutoPlay && balance >= betAmount && !currentBet) {
        newBet = {
          id: `bet_${gameId}`,
          amount: betAmount,
          profit: 0,
          active: true
        };
        
        set(state => ({
          balance: state.balance - betAmount,
          currentBet: newBet
        }));
        
        console.log("Auto-placed bet:", newBet);
      }
      
      set({
        phase: "flying",
        currentMultiplier: 1.0,
        crashPoint,
        gameId,
        timeElapsed: 0
      });
      
      console.log(`New round started - Game ID: ${gameId}, Crash Point: ${crashPoint.toFixed(2)}x`);
    },

    updateMultiplier: (multiplier: number, elapsed: number) => {
      const { crashPoint, autoCashOut, currentBet, phase } = get();
      
      if (phase !== "flying") return;
      
      // Check if we should crash
      if (multiplier >= crashPoint) {
        get().crashGame();
        return;
      }
      
      // Check auto cash out
      if (autoCashOut && currentBet?.active && multiplier >= autoCashOut) {
        get().cashOut();
        return;
      }
      
      set({
        currentMultiplier: multiplier,
        timeElapsed: elapsed
      });
    },

    crashGame: () => {
      const { currentBet, crashPoint, gameId, gameHistory, phase } = get();
      
      if (phase !== "flying") return;
      
      console.log(`Game crashed at ${crashPoint.toFixed(2)}x`);
      
      // Handle active bet loss
      if (currentBet?.active) {
        set(state => ({
          currentBet: {
            ...state.currentBet!,
            active: false,
            profit: -state.currentBet!.amount
          }
        }));
        console.log("Bet lost:", currentBet);
      }
      
      // Add to history
      const newRound: GameRound = {
        id: gameId,
        crashPoint,
        finalMultiplier: crashPoint,
        timestamp: Date.now()
      };
      
      set({
        phase: "crashed",
        gameHistory: [newRound, ...gameHistory.slice(0, 19)], // Keep last 20 rounds
        currentMultiplier: crashPoint
      });
      
      // Start preparing for next round after delay
      setTimeout(() => {
        set({ phase: "preparing" });
        setTimeout(() => {
          get().startNewRound();
        }, 2000); // 2 second preparation time
      }, 2000); // 2 second crash display
    },

    placeBet: (amount: number) => {
      const { balance, phase, gameId } = get();
      
      if (phase !== "waiting" && phase !== "preparing") {
        console.log("Cannot place bet during active game");
        return;
      }
      
      if (balance < amount) {
        console.log("Insufficient balance for bet");
        return;
      }
      
      const bet: Bet = {
        id: `bet_${gameId}_${Date.now()}`,
        amount,
        profit: 0,
        active: true
      };
      
      set(state => ({
        balance: state.balance - amount,
        currentBet: bet
      }));
      
      console.log("Bet placed:", bet);
    },

    cashOut: () => {
      const { currentBet, currentMultiplier, phase } = get();
      
      if (!currentBet?.active || phase !== "flying") {
        console.log("Cannot cash out - no active bet or not flying");
        return;
      }
      
      const profit = currentBet.amount * currentMultiplier;
      const winnings = profit;
      
      set(state => ({
        balance: state.balance + winnings,
        currentBet: {
          ...state.currentBet!,
          cashOutMultiplier: currentMultiplier,
          profit: winnings - state.currentBet!.amount,
          active: false
        }
      }));
      
      console.log(`Cashed out at ${currentMultiplier.toFixed(2)}x for ${winnings.toFixed(2)} coins`);
    },

    setBalance: (balance: number) => {
      set({ balance });
    },
    setBetAmount: (amount: number) => set({ betAmount: Math.max(1, amount) }),
    setAutoPlay: (enabled: boolean) => set({ isAutoPlay: enabled }),
    setAutoCashOut: (multiplier: number | null) => set({ autoCashOut: multiplier })
  }))
);
