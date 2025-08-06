// Game logic utilities for Aviator game

/**
 * Calculate a random crash point using a weighted distribution
 * Lower multipliers are more common than higher ones
 */
export function calculateCrashPoint(): number {
  // Use a weighted random distribution
  // 60% chance of crash between 1.0x - 2.0x
  // 25% chance of crash between 2.0x - 5.0x  
  // 10% chance of crash between 5.0x - 10.0x
  // 4% chance of crash between 10.0x - 50.0x
  // 1% chance of crash between 50.0x - 100.0x
  
  const random = Math.random();
  
  if (random < 0.6) {
    // 1.0x to 2.0x (most common)
    return 1.0 + Math.random() * 1.0;
  } else if (random < 0.85) {
    // 2.0x to 5.0x
    return 2.0 + Math.random() * 3.0;
  } else if (random < 0.95) {
    // 5.0x to 10.0x
    return 5.0 + Math.random() * 5.0;
  } else if (random < 0.99) {
    // 10.0x to 50.0x
    return 10.0 + Math.random() * 40.0;
  } else {
    // 50.0x to 100.0x (very rare)
    return 50.0 + Math.random() * 50.0;
  }
}

/**
 * Calculate the current multiplier based on time elapsed
 * Multiplier grows exponentially over time
 */
export function calculateMultiplier(timeElapsed: number): number {
  // Multiplier starts at 1.0 and grows exponentially
  // Base growth rate: 0.1 per second initially, accelerating over time
  const baseRate = 0.1;
  const acceleration = 0.02;
  
  // Exponential growth: 1.0 + (baseRate * time) + (acceleration * time^1.5)
  const multiplier = 1.0 + (baseRate * timeElapsed) + (acceleration * Math.pow(timeElapsed, 1.5));
  
  return Math.max(1.0, multiplier);
}

/**
 * Generate a unique game ID
 */
export function generateGameId(): string {
  return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format multiplier for display
 */
export function formatMultiplier(multiplier: number): string {
  return `${multiplier.toFixed(2)}x`;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return amount.toFixed(2);
}

/**
 * Calculate the plane's position based on multiplier
 * Returns normalized coordinates for the 3D scene
 */
export function calculatePlanePosition(multiplier: number, timeElapsed: number): [number, number, number] {
  // Smooth upward trajectory tied directly to multiplier
  const baseHeight = (multiplier - 1) * 3; // Height increases with multiplier
  const x = Math.sin(timeElapsed * 0.3) * 1.5; // Gentle side-to-side motion
  const y = baseHeight + Math.sin(timeElapsed * 2) * 0.2; // Smooth ascent with slight bobbing
  const z = timeElapsed * 1.5; // Forward motion over time
  
  return [x, y, z];
}

/**
 * Calculate plane rotation based on movement
 */
export function calculatePlaneRotation(timeElapsed: number, multiplier: number): [number, number, number] {
  const roll = Math.sin(timeElapsed * 0.4) * 0.15; // Smooth banking turns
  const pitch = Math.min(0.2 + (multiplier - 1) * 0.05, 0.5); // Increasing upward angle
  const yaw = Math.cos(timeElapsed * 0.2) * 0.08; // Subtle yaw movement
  
  return [pitch, yaw, roll];
}
