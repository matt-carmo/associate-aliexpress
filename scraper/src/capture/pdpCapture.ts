import type { Page } from "playwright";
import type { CapturedPdp } from "../types.js";

const PDP_ENDPOINT = "/api/v4/pdp/get_pc";

export async function capturePdp(
  page: Page,
  url: string,
  timeoutMs: number,
): Promise<CapturedPdp> {
  const start = Date.now();

  return new Promise<CapturedPdp>((resolve, reject) => {
    let capturedRequest: { url: string; body: unknown } | null = null;
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(Object.assign(new Error("PDP capture timed out"), { code: "timeout" }));
    }, timeoutMs);

    const onRequest = (req: { url: () => string; postData: () => string | null }) => {
      if (!req.url().includes(PDP_ENDPOINT)) return;
      try {
        capturedRequest = {
          url: req.url(),
          body: req.postData() ? JSON.parse(req.postData()!) : null,
        };
      } catch {
        capturedRequest = { url: req.url(), body: req.postData() };
      }
    };

    const onResponse = async (res: { url: () => string; status: () => number; json: () => Promise<unknown> }) => {
      if (!res.url().includes(PDP_ENDPOINT)) return;
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      cleanup();

      try {
        const responseBody = await res.json();
        resolve({
          requestUrl: capturedRequest?.url ?? res.url(),
          requestBody: capturedRequest?.body ?? null,
          responseBody,
          durationMs: Date.now() - start,
        });
      } catch {
        reject(Object.assign(new Error("Failed to parse PDP response"), { code: "pdp_parse_error" }));
      }
    };

    const cleanup = () => {
      page.removeListener("request", onRequest);
      page.removeListener("response", onResponse);
    };

    page.on("request", onRequest);
    page.on("response", onResponse);

    page.goto(url, { waitUntil: "domcontentloaded", timeout: timeoutMs }).catch((err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      cleanup();
      reject(Object.assign(new Error(`Navigation failed: ${err.message}`), { code: "navigation_failed" }));
    });
  });
}
