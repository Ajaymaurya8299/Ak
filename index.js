// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/payments.ts
import Razorpay from "razorpay";
import crypto from "crypto";
var razorpay = null;
function initializeRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    console.warn("Razorpay credentials not found. Payment functionality will be disabled.");
    return null;
  }
  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret
  });
}
razorpay = initializeRazorpay();
async function createPaymentOrder(req, res) {
  try {
    if (!razorpay) {
      return res.status(503).json({
        error: "Payment service unavailable",
        message: "Razorpay not configured. Please contact support."
      });
    }
    const { amount, userId } = req.body;
    if (!amount || amount < 1) {
      return res.status(400).json({ error: "Invalid amount" });
    }
    const amountInPaise = Math.round(amount * 100);
    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `deposit_${userId}_${Date.now()}`,
      payment_capture: 1
    };
    const order = await razorpay.orders.create(options);
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error("Error creating payment order:", error);
    res.status(500).json({ error: "Failed to create payment order" });
  }
}
function verifyPaymentSignature(orderId, paymentId, signature) {
  try {
    if (!process.env.RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay key secret not configured");
    }
    const body = orderId + "|" + paymentId;
    const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(body.toString()).digest("hex");
    return expectedSignature === signature;
  } catch (error) {
    console.error("Error verifying payment signature:", error);
    return false;
  }
}
async function verifyPayment(req, res) {
  try {
    const { orderId, paymentId, signature, userId, amount } = req.body;
    const isValid = verifyPaymentSignature(orderId, paymentId, signature);
    if (!isValid) {
      return res.status(400).json({ error: "Invalid payment signature" });
    }
    const amountInRupees = amount / 100;
    console.log(`Payment verified for user ${userId}: \u20B9${amountInRupees}`);
    res.json({
      success: true,
      message: "Payment verified successfully",
      amount: amountInRupees
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ error: "Payment verification failed" });
  }
}
async function createPayout(req, res) {
  try {
    if (!razorpay) {
      return res.status(503).json({
        error: "Payment service unavailable",
        message: "Razorpay not configured. Please contact support."
      });
    }
    const { amount, accountDetails, userId } = req.body;
    if (!amount || amount < 100) {
      return res.status(400).json({ error: "Minimum withdrawal amount is \u20B9100" });
    }
    const amountInPaise = Math.round(Number(amount) * 100);
    const payoutData = {
      account_number: process.env.RAZORPAY_ACCOUNT_NUMBER || "2323230023902390",
      amount: amountInPaise,
      currency: "INR",
      mode: accountDetails.upi_id ? "UPI" : "IMPS",
      purpose: "payout",
      fund_account: {
        account_type: accountDetails.upi_id ? "vpa" : "bank_account",
        ...accountDetails.upi_id ? { vpa: { address: accountDetails.upi_id } } : {
          bank_account: {
            name: accountDetails.name,
            ifsc: accountDetails.ifsc,
            account_number: accountDetails.account_number
          }
        },
        contact: {
          name: accountDetails.name,
          email: `user_${userId}@aviator.game`,
          contact: "9999999999",
          type: "employee",
          reference_id: `user_${userId}`
        }
      },
      queue_if_low_balance: true,
      reference_id: `withdrawal_${userId}_${Date.now()}`,
      narration: "Aviator Game Withdrawal"
    };
    console.log("Payout request created:", payoutData);
    res.json({
      success: true,
      message: "Withdrawal request submitted successfully",
      referenceId: payoutData.reference_id,
      amount,
      estimatedTime: "1-2 business days"
    });
  } catch (error) {
    console.error("Error creating payout:", error);
    res.status(500).json({ error: "Withdrawal request failed" });
  }
}
async function getPaymentStatus(req, res) {
  try {
    if (!razorpay) {
      return res.status(503).json({ error: "Payment service unavailable" });
    }
    const { paymentId } = req.params;
    const payment = await razorpay.payments.fetch(paymentId);
    res.json({
      id: payment.id,
      status: payment.status,
      amount: payment.amount / 100,
      // Convert to rupees
      method: payment.method,
      created_at: payment.created_at
    });
  } catch (error) {
    console.error("Error fetching payment status:", error);
    res.status(500).json({ error: "Failed to fetch payment status" });
  }
}

// server/routes.ts
async function registerRoutes(app2) {
  app2.get("/api/stats", async (req, res) => {
    try {
      const stats = {
        totalGames: 0,
        totalPlayers: 0,
        averageMultiplier: 2.5,
        highestMultiplier: 100
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });
  app2.get("/api/player/balance", async (req, res) => {
    try {
      const balance = 1e3;
      res.json({ balance });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch balance" });
    }
  });
  app2.post("/api/player/balance", async (req, res) => {
    try {
      const { balance } = req.body;
      if (typeof balance !== "number" || balance < 0) {
        return res.status(400).json({ error: "Invalid balance" });
      }
      res.json({ success: true, balance });
    } catch (error) {
      res.status(500).json({ error: "Failed to update balance" });
    }
  });
  app2.post("/api/game/result", async (req, res) => {
    try {
      const { gameId, crashPoint, playerBet, cashOutMultiplier, profit } = req.body;
      if (!gameId || typeof crashPoint !== "number") {
        return res.status(400).json({ error: "Invalid game data" });
      }
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
  app2.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
  });
  app2.post("/api/payments/create-order", createPaymentOrder);
  app2.post("/api/payments/verify", verifyPayment);
  app2.post("/api/payments/withdraw", createPayout);
  app2.get("/api/payments/status/:paymentId", getPaymentStatus);
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2, { dirname as dirname2 } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
import glsl from "vite-plugin-glsl";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    glsl()
    // Add GLSL shader support
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared")
    }
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  },
  // Add support for large models and audio files
  assetsInclude: ["**/*.gltf", "**/*.glb", "**/*.mp3", "**/*.ogg", "**/*.wav"]
});

// server/vite.ts
import { nanoid } from "nanoid";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname2(__filename2);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(__dirname2, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
