import { hydrateProduct } from "./hydrateProduct";
import { TEMPLATES, type TemplateKey } from "./templates";
import { enqueueBatch, getWhatsAppTarget } from "../backendApi";

export type ImportResult = {
  total: number;
  inserted: number;
  failedUrls: string[];
};

function parseCsvFile(file: File): Promise<string[]> {
  return file.text().then((text) => {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const urlPattern = /^https?:\/\//;
    if (lines.length > 0 && !urlPattern.test(lines[0])) {
      return lines.slice(1);
    }
    return lines;
  });
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

  const urls = await parseCsvFile(file);
  const importId = await sha256(`${file.name}-${file.size}-${Date.now()}`);
  const whatsappTarget = (await getWhatsAppTarget()) || undefined;

  const items: Array<{
    id: string;
    data: unknown;
    caption?: string;
    target?: string;
  }> = [];
  const failedUrls: string[] = [];

  for (const [i, url] of urls.entries()) {
    if (signal?.aborted) break;

    const result = await hydrateProduct(url, signal);
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
