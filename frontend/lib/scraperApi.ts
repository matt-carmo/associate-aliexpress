import "server-only";
import type { ShopeePdpData } from "@/types/shopee";

const SCRAPER_URL = process.env.NEXT_PUBLIC_SCRAPER_API_URL ?? "http://localhost:4001";

export async function fetchPdp(url: string, timeoutMs = 30000): Promise<ShopeePdpData> {
  const res = await fetch(`${SCRAPER_URL}/pdp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, timeoutMs }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Scraper error ${res.status}`);
  }
  return (await res.json()).data;
}
