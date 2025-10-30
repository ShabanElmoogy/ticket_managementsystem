import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import { PORT, HOST, CORS_ORIGINS } from "./config/env.js";
import {
  createHttpOrHttpsServer,
  detectProtocol,
} from "./config/httpServer.js";
import { setupSocket } from "./sockets/io.js";
import { registerCoreMiddleware } from "./middleware/index.js";
import { registerRoutes } from "./routes/index.js";
import { registerErrorHandlers } from "./errors/index.js";
import { connectDB, disconnectDB } from "../config/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  // Start
  try {
    await connectDB();
    server.listen(PORT, HOST, () => {
      const protocol = detectProtocol();
      const hostForLog = process.env.HOST || "localhost";
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }

  // Graceful shutdown
  process.on("SIGINT", async () => {
    console.log("Shutting down server...");
    await disconnectDB();
    process.exit(0);
  });
}
