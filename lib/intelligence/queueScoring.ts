import type { DiscoveryProduct } from "./discoveryProduct";

export type QueueCandidateResult = {
  score: number;
};

export const calculateTelegramCandidateScore = (product: DiscoveryProduct): QueueCandidateResult => {
  let score = 0;

  if (product.title) score += 20;
  if (product.imageUrl) score += 20;
  if (typeof product.price === "number") score += 15;
  if (typeof product.salesVolume === "number" && product.salesVolume > 0) score += 15;
  if (typeof product.rating === "number" && product.rating > 0) score += 15;
  if (typeof product.discountPercent === "number" && product.discountPercent > 0) score += 15;

  return { score: Math.min(100, score) };
};

export const buildQualityWarnings = (product: DiscoveryProduct, candidateScore?: number): string[] => {
  const warnings: string[] = [];

  if (!product.title) warnings.push("⚠️ no title detected");
  if (!product.imageUrl) warnings.push("⚠️ no image detected for preview");
  if ((product.salesVolume ?? 0) < 100) warnings.push("⚠️ limited social proof");

  if (typeof candidateScore === "number" && candidateScore < 40) {
    warnings.push(`⚠️ score low (${candidateScore}/100)`);
  }

  if (warnings.length === 0) {
    warnings.push("No issues detected.");
  }

  return warnings;
};
