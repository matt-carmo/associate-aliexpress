import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { browserManager } from "./browser/BrowserManager.js";
import { createSerialQueue } from "./queue/serialQueue.js";
import { createHealthHandler } from "./routes/health.js";
import { createPdpHandler } from "./routes/pdp.js";

const app = express();
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

const queue = createSerialQueue(config.maxQueue);

app.get("/health", createHealthHandler(queue));
app.post("/pdp", createPdpHandler(queue));

async function boot() {
  await browserManager.init();
  app.listen(config.port, () => {
    console.log(`Scraper listening on http://localhost:${config.port}`);
  });
}

async function shutdown(signal: string) {
  console.log(`Received ${signal}, shutting down...`);
  await browserManager.close();
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

boot().catch((err) => {
  console.error("Boot failed:", err);
  process.exit(1);
});
