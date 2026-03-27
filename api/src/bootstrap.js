import dotenv from 'dotenv';
dotenv.config();

import express from "express";
import { createHttpOrHttpsServer, detectProtocol } from "./config/httpServer.js";
import { setupSocket } from "./sockets/io.js";
import { registerCoreMiddleware } from "./middleware/index.js";
import { registerRoutes } from "./routes/index.js";
import { registerErrorHandlers } from "./errors/index.js";
import { startNotificationScheduler } from "./utils/scheduler.js";

const PORT = process.env.PORT || 3000;
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : process.env.HOST || 'localhost';

export async function startServer() {
  const app = express();
  const server = createHttpOrHttpsServer(app);

  const { io, notificationEmitter } = setupSocket(server);

  registerCoreMiddleware(app, notificationEmitter);
  registerRoutes(app);
  registerErrorHandlers(app);
  startNotificationScheduler();

  try {
    server.listen(PORT, HOST, () => {
      const protocol = detectProtocol();
      console.log(`Server running on ${protocol}://${HOST}:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }

  process.on("SIGINT", async () => {
    console.log("Shutting down server...");
    process.exit(0);
  });
}
