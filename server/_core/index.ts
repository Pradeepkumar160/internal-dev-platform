import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { Server as SocketIOServer } from "socket.io";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

// Store active Socket.IO connections for log streaming
const logSubscriptions = new Map<string, Set<string>>();

// Export broadcast functions for use in API handlers
export function broadcastLog(deploymentId: number, message: string, level: string = "info") {
  if (globalIO) {
    const roomName = `deployment-${deploymentId}`;
    globalIO.to(roomName).emit("log", {
      deploymentId,
      message,
      level,
      timestamp: new Date().toISOString(),
    });
  }
}

export function broadcastHealthUpdate(serviceId: number, status: string, uptime: number) {
  if (globalIO) {
    const roomName = `service-health-${serviceId}`;
    globalIO.to(roomName).emit("health-update", {
      serviceId,
      status,
      uptime,
      timestamp: new Date().toISOString(),
    });
  }
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Initialize Socket.IO for real-time log streaming
  const io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Subscribe to deployment logs
    socket.on("subscribe-logs", (deploymentId: number) => {
      const roomName = `deployment-${deploymentId}`;
      socket.join(roomName);
      if (!logSubscriptions.has(roomName)) {
        logSubscriptions.set(roomName, new Set());
      }
      logSubscriptions.get(roomName)?.add(socket.id);
      console.log(`[Socket.IO] Client ${socket.id} subscribed to ${roomName}`);
    });

    // Unsubscribe from deployment logs
    socket.on("unsubscribe-logs", (deploymentId: number) => {
      const roomName = `deployment-${deploymentId}`;
      socket.leave(roomName);
      logSubscriptions.get(roomName)?.delete(socket.id);
      console.log(`[Socket.IO] Client ${socket.id} unsubscribed from ${roomName}`);
    });

    // Subscribe to service health updates
    socket.on("subscribe-health", (serviceId: number) => {
      const roomName = `service-health-${serviceId}`;
      socket.join(roomName);
      console.log(`[Socket.IO] Client ${socket.id} subscribed to health updates for service ${serviceId}`);
    });

    // Unsubscribe from service health updates
    socket.on("unsubscribe-health", (serviceId: number) => {
      const roomName = `service-health-${serviceId}`;
      socket.leave(roomName);
      console.log(`[Socket.IO] Client ${socket.id} unsubscribed from health updates for service ${serviceId}`);
    });

    socket.on("disconnect", () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
      // Clean up subscriptions
      for (const [room, clients] of logSubscriptions.entries()) {
        clients.delete(socket.id);
      }
    });
  });

  // Export io for use in other modules
  (app as any).io = io;
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  
  // Helper function to broadcast logs to subscribed clients
  (app as any).broadcastLog = (deploymentId: number, message: string, level: string = "info") => {
    const roomName = `deployment-${deploymentId}`;
    io.to(roomName).emit("log", {
      deploymentId,
      message,
      level,
      timestamp: new Date().toISOString(),
    });
  };
  
  // Helper function to broadcast service health updates
  (app as any).broadcastHealthUpdate = (serviceId: number, status: string, uptime: number) => {
    const roomName = `service-health-${serviceId}`;
    io.to(roomName).emit("health-update", {
      serviceId,
      status,
      uptime,
      timestamp: new Date().toISOString(),
    });
  };
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  
  // Health check endpoint
  app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Dev login endpoint - creates admin session without OAuth
  app.post("/api/dev-login", async (req, res) => {
    try {
      const { upsertUser, getUserByOpenId } = await import("../db.js");
      await upsertUser({ openId: "dev-user-001", name: "Dev User", email: "dev@localhost", role: "admin", loginMethod: "dev" });
      const user = await getUserByOpenId("dev-user-001");
      const { SignJWT } = await import("jose");
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret");
      const token = await new SignJWT({ openId: "dev-user-001", appId: process.env.VITE_APP_ID || "local-dev", name: "Dev User" })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("7d")
        .sign(secret);
      res.cookie("app_session_id", token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, path: "/" });
      res.json({ success: true, user });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use environment variable for port, default to 5173 (different from default 3000)
  const preferredPort = parseInt(process.env.PORT || "5174");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  // Set global IO for use in other modules
  globalIO = io;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    console.log(`Socket.IO ready for real-time connections`);
  });
}

// Export io for external use
export let globalIO: SocketIOServer | null = null;

startServer().catch(console.error);
