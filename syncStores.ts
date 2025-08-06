// Store synchronization utility to avoid circular dependencies
import { useAuthStore } from "./useAuth";
import { useAviatorGame } from "./useAviatorGame";

// Initialize balance sync when user logs in
export function syncGameBalanceFromAuth() {
  const { user } = useAuthStore.getState();
  const { setBalance } = useAviatorGame.getState();
  
  if (user) {
    setBalance(user.balance);
  }
}

// Update auth store when game balance changes
export function syncAuthBalanceFromGame(newBalance: number) {
  const { updateBalance } = useAuthStore.getState();
  updateBalance(newBalance);
}

// Set up bidirectional sync - simplified version
export function setupBalanceSync() {
  // For now, we'll handle sync manually through function calls
  // Future enhancement could use Zustand's subscriptions
  console.log("Balance sync initialized");
}