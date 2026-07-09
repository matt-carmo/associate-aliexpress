import type { Request, Response } from "express";
import type { HealthResponse } from "../types.js";
import { browserManager } from "../browser/BrowserManager.js";
import type { SerialQueue } from "../queue/serialQueue.js";

export function createHealthHandler(queue: SerialQueue) {
  return (_req: Request, res: Response) => {
    const health: HealthResponse = {
      status: "ok",
      chrome: browserManager.isConnected() ? "connected" : "disconnected",
      queueDepth: queue.getDepth(),
      uptime: process.uptime(),
    };
    res.json(health);
  };
}
