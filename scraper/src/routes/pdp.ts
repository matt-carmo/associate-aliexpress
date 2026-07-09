import type { Request, Response } from "express";
import { browserManager } from "../browser/BrowserManager.js";
import { capturePdp } from "../capture/pdpCapture.js";
import { normalizePdp } from "../capture/pdpNormalizer.js";
import { config } from "../config.js";
import type { SerialQueue } from "../queue/serialQueue.js";
import type { PdpRequest } from "../types.js";

const SHOPEE_URL_RE = /shopee\.com\.br\//;

export function createPdpHandler(queue: SerialQueue) {
  return async (req: Request, res: Response) => {
    const { url, timeoutMs } = req.body as PdpRequest;

    if (!url || typeof url !== "string" || !SHOPEE_URL_RE.test(url)) {
      return res.status(400).json({ ok: false, error: "invalid_url", message: "URL must be a valid shopee.com.br link" });
    }

    const timeout = timeoutMs ?? config.pdpTimeoutMs;

    try {
      const result = await queue.enqueue(async () => {
        const page = await browserManager.ensureConnected();
        const captured = await capturePdp(page, url, timeout);
        const data = normalizePdp(
          captured.responseBody as Record<string, unknown>,
          url,
        );
        return { data, durationMs: captured.durationMs };
      }, timeout + 5000);

      return res.json({
        ok: true,
        data: result.data,
        capturedAt: result.data.capturedAt,
        durationMs: result.durationMs,
      });
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      const code = error.code ?? "unknown_error";
      const message = error.message ?? "Unknown error";

      const statusMap: Record<string, number> = {
        timeout: 408,
        navigation_failed: 502,
        pdp_not_captured: 504,
        chrome_disconnected: 503,
        queue_full: 503,
      };

      return res.status(statusMap[code] ?? 500).json({ ok: false, error: code, message });
    }
  };
}
