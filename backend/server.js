import express from "express";
import cors from "cors";
import { createServer } from "http";
import { createServer as createHttpsServer } from "https";
import { Server } from "socket.io";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Import routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import kanbanRoutes from "./routes/kanbanRoutes.js";
import labelRoutes from "./routes/labelRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import whatsappRoutes from "./routes/whatsappRoutes.js";
import docRoutes from "./routes/docRoutes.js";

// Import middleware
import socketMiddleware from "./middleware/socketMiddleware.js";

// Import utils
import { emitNotification } from "./utils/socketHelpers.js";

// Import config
import { connectDB, disconnectDB } from "./config/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || 'localhost';
const USE_HTTPS = process.env.USE_HTTPS === 'true';
const CORS_ORIGINS = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ["https://localhost:5173", "http://localhost:5173"];

let server;

// Create HTTPS server if certificates exist, otherwise HTTP
if (USE_HTTPS) {
  try {
    const keyPath = path.join(__dirname, '.cert', 'key.pem');
    const certPath = path.join(__dirname, '.cert', 'key.pem');
    
    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      const httpsOptions = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      };
      server = createHttpsServer(httpsOptions, app);
      console.log('HTTPS server enabled');
    } else {
      console.log('HTTPS certificates not found, falling back to HTTP');
      server = createServer(app);
    }
  } catch (error) {
    console.log('Error loading HTTPS certificates, falling back to HTTP:', error.message);
    server = createServer(app);
  }
} else {
  server = createServer(app);
}

const io = new Server(server, {
  cors: {
    origin: CORS_ORIGINS,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: CORS_ORIGINS,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Create notification emitter function
const notificationEmitter = emitNotification(io);

// Add socket middleware to inject notification function
app.use(socketMiddleware(notificationEmitter));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/kanban", kanbanRoutes);
app.use("/api/labels", labelRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/docsbuilder", docRoutes);
app.use("/api", docRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, HOST, () => {
      const protocol = USE_HTTPS && fs.existsSync(path.join(__dirname, '.cert', 'key.pem')) ? 'https' : 'http';
      console.log(`Server running on ${protocol}://${HOST}:${PORT}`);
      console.log(`API Base URL: ${protocol}://${HOST}:${PORT}/api`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`CORS Origins: ${CORS_ORIGINS.join(', ')}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down server...");
  await disconnectDB();
  process.exit(0);
});

// Start the server
startServer();