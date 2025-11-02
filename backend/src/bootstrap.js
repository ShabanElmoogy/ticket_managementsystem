import dotenv from 'dotenv';
dotenv.config();

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import {
  createHttpOrHttpsServer,
  detectProtocol,
} from "./config/httpServer.js";
import { setupSocket } from "./sockets/io.js";
import { registerCoreMiddleware } from "./middleware/index.js";
import { registerRoutes } from "./routes/index.js";
import { registerErrorHandlers } from "./errors/index.js";
import { startNotificationScheduler } from "./utils/scheduler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

export async function startServer() {
  const app = express();
  const server = createHttpOrHttpsServer(app);

  // Sockets
  const { io, notificationEmitter } = setupSocket(server);

  // Middleware
  registerCoreMiddleware(app, notificationEmitter);

  // Routes
  registerRoutes(app);

  if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../frontend/dist")));

    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
    });
  }

  // Errors
  registerErrorHandlers(app);

  // Start notification scheduler
  startNotificationScheduler();

  // Start
  try {
    server.listen(PORT, HOST, () => {
      const protocol = detectProtocol();
      console.log(`Server running on ${protocol}://${HOST}:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }

  // Graceful shutdown
  process.on("SIGINT", async () => {
    console.log("Shutting down server...");
    process.exit(0);
  });
}
