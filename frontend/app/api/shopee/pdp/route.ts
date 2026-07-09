import { NextResponse } from "next/server";
import { fetchPdp } from "@/lib/scraperApi";

export async function POST(request: Request) {
  const { url, timeoutMs } = await request.json();
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });
  try {
    const data = await fetchPdp(url, timeoutMs);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "scraper error" }, { status: 502 });
  }
}
