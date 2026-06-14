import express from "express";
import cors from "cors";
import { startScheduler, stopScheduler } from "./scheduler.js";
import { getConnectionStatus, getSocket } from "./services/whatsapp.js";
import { telegramRouter } from "./routes/telegram.js";
import { whatsappRouter } from "./routes/whatsapp.js";
import { queueRouter } from "./routes/queue.js";
import { getQueueStats } from "./storage/queueStorage.js";
import { closeDb } from "./storage/database.js";

const app = express();
const port = Number(process.env.PORT) || 4000;
const startTime = Date.now();

const corsOrigin = process.env.CORS_ORIGIN ?? "*";
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: "2mb" }));

app.get("/health", async (_req, res) => {
  const waStatus = getConnectionStatus();
  const stats = getQueueStats();
  const uptime = Math.floor((Date.now() - startTime) / 1000);

  res.json({
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

const server = app.listen(port, () => {
  console.log(`[Messaging] API listening on ${port}`);
  startScheduler();
  console.log("[Messaging] Scheduler started");
  getSocket()
    .then(() => console.log("[Messaging] WhatsApp socket initialized"))
    .catch((err) =>
      console.warn("[Messaging] WhatsApp init failed (will retry on first send):", err)
    );
});

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
