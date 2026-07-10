import { hydrateProductWithoutScraper, hydrateProductWithScraper } from "./hydrateProduct";
import { TEMPLATES, type TemplateKey } from "./templates";
import { enqueueBatch, getWhatsAppTarget } from "../backendApi";
import type { DiscoveryProduct } from "./discoveryProduct";

export type ImportResult = {
  total: number;
  inserted: number;
  failedUrls: string[];
};

type CsvRow = {
  itemId: string;
  title: string;
  originalPrice: number;
  salesVolume: number;
  store: string;
  commissionRate: number;
  price: number;
  productUrl: string;
  affiliateUrl: string;
};

type ParseResult =
  | { type: "single"; urls: string[] }
  | { type: "multi"; rows: CsvRow[] };

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        fields.push(current);
        current = "";
      } else {
        current += char;
      }
    }
  }
  fields.push(current);
  return fields;
}

function parseBrNumber(value: string): number {
  const cleaned = value.replace(/[R$\s]/g, "").replace(",", ".").trim();
  return Number.parseFloat(cleaned) || 0;
}

function parseSalesVolume(value: string): number {
  const cleaned = value.replace(/[+]/g, "").trim();
  const match = cleaned.match(/^([\d,.]+)\s*mil/i);
  if (match) {
    return Number.parseFloat(match[1].replace(",", ".")) * 1000;
  }
  return Number.parseInt(cleaned.replace(/\./g, ""), 10) || 0;
}

function parseCommissionRate(value: string): number {
  return parseBrNumber(value.replace("%", ""));
}

async function parseCsvFile(file: File): Promise<ParseResult> {
  const text = await file.text();
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return { type: "single", urls: [] };

  const firstFields = parseCsvLine(lines[0]);

  if (firstFields.length >= 9) {
    const rows: CsvRow[] = [];
    for (const line of lines) {
      const f = parseCsvLine(line);
      if (f.length < 9) continue;
      rows.push({
        itemId: f[0]?.trim() ?? "",
        title: f[1]?.trim() ?? "",
        price: parseBrNumber(f[2] ?? "0"),
        salesVolume: parseSalesVolume(f[3] ?? "0"),
        store: f[4]?.trim() ?? "",
        commissionRate: parseCommissionRate(f[5] ?? "0"),
        originalPrice: 0,
        productUrl: f[7]?.trim() ?? "",
        affiliateUrl: f[8]?.trim() ?? "",
      });
    }
    return { type: "multi", rows };
  }

  const urlPattern = /^https?:\/\//;
  if (!urlPattern.test(firstFields[0] ?? "")) {
    return { type: "single", urls: lines.slice(1) };
  }
  return { type: "single", urls: lines };
}

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 12);
}

export async function importBatchCsv(opts: {
  file: File;
  template: TemplateKey;
  onProgress?: (current: number, total: number) => void;
  signal?: AbortSignal;
}): Promise<ImportResult> {
  const { file, template, onProgress, signal } = opts;

  const parsed = await parseCsvFile(file);
  const importId = await sha256(`${file.name}-${file.size}-${Date.now()}`);
  const whatsappTarget = (await getWhatsAppTarget()) || undefined;

  const items: Array<{
    id: string;
    data: unknown;
    caption?: string;
    target?: string;
  }> = [];
  const failedUrls: string[] = [];

  if (parsed.type === "multi") {
    const { rows } = parsed;
    for (const [i, row] of rows.entries()) {
      if (signal?.aborted) break;

      const result = await hydrateProductWithoutScraper(
        row.productUrl,
        signal,
        row.affiliateUrl,
      );
      if (!result) {
        failedUrls.push(row.productUrl);
        onProgress?.(i + 1, rows.length);
        continue;
      }

      const hydrated: DiscoveryProduct = {
        ...result.hydrated,
        title:  result.hydrated.title || row.title,
        price:  result.hydrated.price || row.price,
        originalPrice:  result.hydrated.originalPrice || row.originalPrice,
        salesVolume:  result.hydrated.salesVolume || row.salesVolume,
        commissionRate:  result.hydrated.commissionRate || row.commissionRate,
      };

      const caption = TEMPLATES[template].generate(hydrated, row.affiliateUrl);
      items.push({
        id: `csv-${importId}-${i}`,
        data: hydrated,
        caption,
        target: whatsappTarget,
      });

      onProgress?.(i + 1, rows.length);
    }

    if (items.length > 0) {
      await enqueueBatch(items);
    }

    return {
      total: rows.length,
      inserted: items.length,
      failedUrls,
    };
  }

  const { urls } = parsed;
  for (const [i, url] of urls.entries()) {
    if (signal?.aborted) break;

    const result = await hydrateProductWithoutScraper(url, signal);
    if (!result) {
      failedUrls.push(url);
      onProgress?.(i + 1, urls.length);
      continue;
    }

    const { hydrated, promotionLink } = result;
    const caption = TEMPLATES[template].generate(hydrated, promotionLink);

    items.push({
      id: `csv-${importId}-${i}`,
      data: hydrated,
      caption,
      target: whatsappTarget,
    });

    onProgress?.(i + 1, urls.length);
  }

  if (items.length > 0) {
    await enqueueBatch(items);
  }

  return {
    total: urls.length,
    inserted: items.length,
    failedUrls,
  };
}

export async function importBatchCsvWithScraper(opts: {
  file: File;
  template: TemplateKey;
  onProgress?: (current: number, total: number) => void;
  signal?: AbortSignal;
}): Promise<ImportResult> {
  const { file, template, onProgress, signal } = opts;

  const parsed = await parseCsvFile(file);
  const importId = await sha256(`${file.name}-${file.size}-${Date.now()}`);
  const whatsappTarget = (await getWhatsAppTarget()) || undefined;

  const items: Array<{
    id: string;
    data: unknown;
    caption?: string;
    target?: string;
  }> = [];
  const failedUrls: string[] = [];

  if (parsed.type === "single") {
    return { total: 0, inserted: 0, failedUrls: ["Scraper import requires CSV with Product Link and Offer Link columns"] };
  }

  const { rows } = parsed;
  for (const [i, row] of rows.entries()) {
    if (signal?.aborted) break;

    const result = await hydrateProductWithScraper(
      row.productUrl,
      signal,
      row.affiliateUrl,
    );

    console.log(`Hydration result for ${row.productUrl}:`, result);
    if (!result) {
      failedUrls.push(row.productUrl);
      onProgress?.(i + 1, rows.length);
      continue;
    }

    const hydrated: DiscoveryProduct = {
      ...result.hydrated,
      title:  result.hydrated.title || row.title,
      price:  result.hydrated.price || row.price,
      originalPrice:  result.hydrated.originalPrice || row.originalPrice,
      salesVolume:  result.hydrated.salesVolume || row.salesVolume,
      commissionRate:  result.hydrated.commissionRate || row.commissionRate,
    };

    const caption = TEMPLATES[template].generate(hydrated, row.affiliateUrl);
    items.push({
      id: `csv-scraper-${importId}-${i}`,
      data: hydrated,
      caption,
      target: whatsappTarget,
    });

    onProgress?.(i + 1, rows.length);
  }

  if (items.length > 0) {
    await enqueueBatch(items);
  }

  return {
    total: rows.length,
    inserted: items.length,
    failedUrls,
  };
}
