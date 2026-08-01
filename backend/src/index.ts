import express, { type Request, type Response, type NextFunction } from "express";
import { startScheduler, stopScheduler } from "./scheduler.js";
import { getConnectionStatus, getSocket } from "./services/whatsapp.js";
import { telegramRouter } from "./routes/telegram.js";
import { whatsappRouter } from "./routes/whatsapp.js";
import { queueRouter } from "./routes/queue.js";
import { getQueueStats } from "./storage/queueStorage.js";
import { closeDb } from "./storage/database.js";
import cors from "cors";

const app = express();
const port = Number(process.env.BACKEND_PORT) || 4000;
const startTime = Date.now();

const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:3000";

console.log(`[Server] CORS_ORIGIN set to: ${corsOrigin}`);
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: "2mb" }));

app.get("/health", async (_req, res) => {

  const waStatus = getConnectionStatus();
  const stats = getQueueStats();
  const uptime = Math.floor((Date.now() - startTime) / 1000);

  return res.json({
    status: "ok",
    uptime,
    whatsapp: {
      connection: waStatus,
    },
    queue: stats,
    timestamp: Date.now(),
  });
});

app.use("/telegram", telegramRouter);
app.use("/whatsapp", whatsappRouter);
app.use("/queue", queueRouter);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  const isBadJson = err instanceof SyntaxError && "body" in err;
  console.error("[Server] Request error:", err);
  if (res.headersSent) return;
  res.status(isBadJson ? 400 : 500).json({
    error: isBadJson ? "Invalid JSON body" : "Internal server error",
  });
});

const server = app.listen(port, '127.0.0.1',  (e) => {
  startScheduler();
  getSocket()
    .then(() => console.log("[Messaging] WhatsApp socket initialized"))
    .catch((err) =>
      console.warn("[Messaging] WhatsApp init failed (will retry on first send):", err)
    );
});
console.log(server)
function gracefulShutdown(signal: string) {
  console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);

  stopScheduler();

  server.close(() => {
    console.log("[Server] HTTP server closed");
    closeDb();
    console.log("[Server] Database closed");
    process.exit(0);
  });

  setTimeout(() => {
    console.error("[Server] Forced shutdown after timeout");
    closeDb();
    process.exit(1);
  }, 10_000);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  console.error("[Server] Unhandled rejection (keeping alive):", reason);
});

process.on("uncaughtException", (err) => {
  console.error("[Server] Uncaught exception (keeping alive):", err);
});
