import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  createPaymentOrder, 
  verifyPayment, 
  createPayout, 
  getPaymentStatus 
} from "./payments";

export async function registerRoutes(app: Express): Promise<Server> {
  // Game statistics endpoint
  app.get("/api/stats", async (req, res) => {
    try {
      // In a real implementation, this would fetch from database
      const stats = {
        totalGames: 0,
        totalPlayers: 0,
        averageMultiplier: 2.5,
        highestMultiplier: 100.0
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  // Player balance endpoint (for persistence)
  app.get("/api/player/balance", async (req, res) => {
    try {
      // In a real implementation, this would fetch from user session/database
      const balance = 1000; // Default starting balance
      res.json({ balance });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch balance" });
    }
  });

  // Update player balance endpoint
  app.post("/api/player/balance", async (req, res) => {
    try {
      const { balance } = req.body;
      
      if (typeof balance !== "number" || balance < 0) {
        return res.status(400).json({ error: "Invalid balance" });
      }
      
      // In a real implementation, this would update user balance in database
      res.json({ success: true, balance });
    } catch (error) {
      res.status(500).json({ error: "Failed to update balance" });
    }
  });

  // Game result endpoint (for recording game outcomes)
  app.post("/api/game/result", async (req, res) => {
    try {
      const { gameId, crashPoint, playerBet, cashOutMultiplier, profit } = req.body;
      
      // Validate input
      if (!gameId || typeof crashPoint !== "number") {
        return res.status(400).json({ error: "Invalid game data" });
      }
      
      // In a real implementation, this would save to database
      const gameResult = {
        gameId,
        crashPoint,
        playerBet: playerBet || null,
        cashOutMultiplier: cashOutMultiplier || null,
        profit: profit || 0,
        timestamp: Date.now()
      };
      
      console.log("Game result recorded:", gameResult);
      
      res.json({ success: true, gameResult });
    } catch (error) {
      res.status(500).json({ error: "Failed to record game result" });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
  });

  // Payment Routes
  app.post("/api/payments/create-order", createPaymentOrder);
  app.post("/api/payments/verify", verifyPayment);
  app.post("/api/payments/withdraw", createPayout);
  app.get("/api/payments/status/:paymentId", getPaymentStatus);

  const httpServer = createServer(app);

  return httpServer;
}
