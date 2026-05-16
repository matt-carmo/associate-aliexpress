import { evaluateTelegramGate, TELEGRAM_GATE_CONFIG } from "./telegramGate";
import type { ProductIntelligence } from "./product-intelligence";

export type MarketplaceBadge = {
  label: string;
  tone: string;
  detail?: string;
};

export type TelegramCandidateBreakdown = {
  salesVolume: number;
  rating: number;
  discount: number;
  brandRecognition: number;
  visualAppeal: number;
  lowPriceImpulse: number;
  socialProof: number;
  bundleDeal: number;
  topSellingIndicators: number;
};

export type TelegramCandidateResult = {
  score: number;
  breakdown: TelegramCandidateBreakdown;
  reasons: string[];
};

const clamp = (value: number, minimum = 0, maximum = 10): number => {
  return Math.max(minimum, Math.min(maximum, value));
};

const scaleToTen = (value: number, minimum: number, maximum: number): number => {
  if (maximum <= minimum) {
    return 0;
  }

  const normalized = (value - minimum) / (maximum - minimum);
  return clamp(normalized * 10);
};

const lower = (value?: string): string => (value || "").toLowerCase();

const titleText = (product: Partial<ProductIntelligence>): string => {
  return lower(product.title);
};

const brandKeywords = [
  "anker",
  "baseus",
  "ugreen",
  "xiaomi",
  "logitech",
  "jbl",
  "razer",
  "lenovo",
  "asus",
  "msi",
  "hp",
  "dell",
  "intel",
  "amd",
  "samsung",
  "kingston",
  "adata",
  "seagate",
  "western digital",
  "wd",
  "vention",
  "orico",
  "redragon",
  "soundcore",
  "fifine",
  "steelseries",
];

const visualKeywords = [
  "rgb",
  "led",
  "neon",
  "transparent",
  "mechanical",
  "pro",
  "max",
  "mini",
  "compact",
  "dock",
  "display",
  "magnetic",
  "wireless",
  "glow",
  "gaming",
  "handheld",
  "smart",
  "foldable",
];

const bundleKeywords = ["bundle", "kit", "set", "pack", "combo", "pair", "2 in 1", "3 in 1"];
const techKeywords = ["rgb", "gaming", "earbud", "ssd", "ram", "monitor", "keyboard", "mouse", "dock", "smart", "console", "device", "adapter", "charger", "headset", "speaker"];

const getPrice = (product: Partial<ProductIntelligence>): number => {
  return typeof product.price === "number" ? product.price : 0;
};

const getDiscount = (product: Partial<ProductIntelligence>): number => {
  return typeof product.discountPercent === "number" ? product.discountPercent : 0;
};

const getSales = (product: Partial<ProductIntelligence>): number => {
  return typeof product.salesVolume === "number" ? product.salesVolume : 0;
};

const getRating = (product: Partial<ProductIntelligence>): number => {
  return typeof product.rating === "number" ? product.rating : 0;
};

const getTitleScore = (product: Partial<ProductIntelligence>, keywords: string[]): number => {
  const title = titleText(product);
  let matches = 0;

  for (const keyword of keywords) {
    if (title.includes(keyword)) {
      matches += 1;
    }
  }

  return clamp(matches * 2.5);
};

const getBrandRecognitionScore = (product: Partial<ProductIntelligence>): number => {
  const title = titleText(product);
  if (!title) {
    return 0;
  }

  let matches = 0;
  for (const keyword of brandKeywords) {
    if (title.includes(keyword)) {
      matches += 1;
    }
  }

  if (product.score && product.score >= 80) {
    matches += 1;
  }

  return clamp(matches * 2.2);
};

const getVisualAppealScore = (product: Partial<ProductIntelligence>): number => {
  const title = titleText(product);
  let score = 0;

  for (const keyword of visualKeywords) {
    if (title.includes(keyword)) {
      score += 1.2;
    }
  }

  if (product.hasVideo) {
    score += 1.8;
  }

  if (product.imageUrl) {
    score += 1.1;
  }

  if (title.length >= 18 && title.length <= 90) {
    score += 1.0;
  }

  return clamp(score * 2.2);
};

const getLowPriceImpulseScore = (product: Partial<ProductIntelligence>): number => {
  const price = getPrice(product);
  const discount = getDiscount(product);

  if (!price) {
    return 0;
  }

  let score = 0;
  if (price <= 15) score += 4;
  else if (price <= 25) score += 3.5;
  else if (price <= 40) score += 2.5;
  else if (price <= 70) score += 1.5;

  if (discount >= 20) score += 2;
  if (discount >= 35) score += 2;

  return clamp(score);
};

const getSocialProofScore = (product: Partial<ProductIntelligence>): number => {
  const salesScore = scaleToTen(getSales(product), 0, 3000);
  const ratingScore = scaleToTen(getRating(product), 3.8, 5);
  const scoreScore = scaleToTen(typeof product.score === "number" ? product.score : 0, 50, 100);

  return clamp(salesScore * 0.5 + ratingScore * 0.3 + scoreScore * 0.2);
};

const getBundleDealScore = (product: Partial<ProductIntelligence>): number => {
  const title = titleText(product);
  let score = 0;

  for (const keyword of bundleKeywords) {
    if (title.includes(keyword)) {
      score += 2.5;
    }
  }

  if (getDiscount(product) >= 25) {
    score += 1.5;
  }

  return clamp(score);
};

const getTopSellingScore = (product: Partial<ProductIntelligence>): number => {
  let score = scaleToTen(getSales(product), 100, 5000);

  if (product.isHotProduct) {
    score += 2.5;
  }

  if (typeof product.score === "number" && product.score >= 75) {
    score += 1.5;
  }

  return clamp(score);
};

const formatPrice = (product: Partial<ProductIntelligence>): string => {
  const price = getPrice(product);

  if (!price) {
    return "Check price";
  }

  return `$${price.toFixed(2)}`;
};

const escapeHtml = (value: string): string => {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

export const calculateTelegramCandidateScore = (
  product: Partial<ProductIntelligence>
): TelegramCandidateResult => {
  const salesVolume = scaleToTen(getSales(product), 50, 3000);
  const rating = scaleToTen(getRating(product), 3.6, 5);
  const discount = scaleToTen(getDiscount(product), 0, 60);
  const brandRecognition = getBrandRecognitionScore(product);
  const visualAppeal = getVisualAppealScore(product);
  const lowPriceImpulse = getLowPriceImpulseScore(product);
  const socialProof = getSocialProofScore(product);
  const bundleDeal = getBundleDealScore(product);
  const topSellingIndicators = getTopSellingScore(product);

  const breakdown: TelegramCandidateBreakdown = {
    salesVolume,
    rating,
    discount,
    brandRecognition,
    visualAppeal,
    lowPriceImpulse,
    socialProof,
    bundleDeal,
    topSellingIndicators,
  };

  const weightedTotal =
    salesVolume * 1.8 +
    rating * 1.5 +
    discount * 1.0 +
    brandRecognition * 1.1 +
    visualAppeal * 1.4 +
    lowPriceImpulse * 1.1 +
    socialProof * 1.4 +
    bundleDeal * 0.9 +
    topSellingIndicators * 1.8;

  const score = Math.round((weightedTotal / 120) * 100);
  const reasons: string[] = [];

  if (salesVolume >= 7) reasons.push("strong sales momentum");
  if (rating >= 7) reasons.push("trusted rating");
  if (discount >= 7) reasons.push("high discount pull");
  if (brandRecognition >= 6) reasons.push("brand recognition");
  if (visualAppeal >= 6) reasons.push("thumb-stopping visuals");
  if (lowPriceImpulse >= 6) reasons.push("low-price impulse");
  if (socialProof >= 6) reasons.push("social proof");
  if (bundleDeal >= 5) reasons.push("bundle-friendly");
  if (topSellingIndicators >= 6) reasons.push("top-selling signal");

  return {
    score: clamp(score, 0, 100),
    breakdown,
    reasons,
  };
};

export const buildMarketplaceBadges = (
  product: Partial<ProductIntelligence>
): MarketplaceBadge[] => {
  const badges: MarketplaceBadge[] = [];
  const candidate = calculateTelegramCandidateScore(product);
  const title = titleText(product);
  const sales = getSales(product);
  const rating = getRating(product);
  const discount = getDiscount(product);
  const price = getPrice(product);
  const techScore = getTitleScore(product, techKeywords);

  if (sales >= 1000 || (typeof product.score === "number" && product.score >= 80)) {
    badges.push({ label: "Top Selling", tone: "emerald", detail: "High sales traction" });
  }

  if (candidate.breakdown.bundleDeal >= 5) {
    badges.push({ label: "Bundle Deal", tone: "violet", detail: "Feels like a multi-item value play" });
  }

  if (price > 0 && price <= 35 && discount >= 30) {
    badges.push({ label: "Lowest Price in 90 Days", tone: "amber", detail: "Strong price-drop impulse" });
  }

  if (rating >= 4.5 && sales >= 200) {
    badges.push({ label: "Choice", tone: "sky", detail: "Good blend of trust and traction" });
  }

  if (rating >= 4.6 || candidate.breakdown.brandRecognition >= 6) {
    badges.push({ label: "Premium Quality", tone: "indigo", detail: "Brand or review-led trust" });
  }

  if (candidate.score >= 72 || product.isHotProduct) {
    badges.push({ label: "Trending", tone: "rose", detail: "Current feed momentum" });
  }

  if (candidate.score >= 74 || (sales >= 300 && (product.commissionRate ?? 0) >= 8)) {
    badges.push({ label: "High Conversion", tone: "cyan", detail: "Likely to convert in Telegram" });
  }

  if (techScore >= 4 || candidate.breakdown.visualAppeal >= 6) {
    badges.push({ label: "Tech Pick", tone: "lime", detail: "Best fit for the tech audience" });
  }

  return badges.slice(0, 4);
};

export const buildQualityWarnings = (
  product: Partial<ProductIntelligence>,
  candidateScore?: number
): string[] => {
  const warnings: string[] = [];
  const gate = evaluateTelegramGate(product, TELEGRAM_GATE_CONFIG);

//   if (!gate.approved) {
//     warnings.push(...gate.reasons.filter((reason) => reason.startsWith("❌")));
//   }

  if (gate.warnings.length > 0) {
    warnings.push(...gate.warnings);
  }

//   if (typeof candidateScore === "number" && candidateScore < 68) {
//     warnings.push(`⚠️ Telegram Candidate Score is only ${candidateScore}/100`);
//   }

  if ((product.salesVolume ?? 0) < 100) {
    warnings.push("⚠️ limited social proof");
  }

  if ((product.discountPercent ?? 0) > 80) {
    warnings.push("⚠️ discount may be too aggressive");
  }

  if (!product.imageUrl) {
    warnings.push("⚠️ no image detected for preview");
  }

  return warnings;
};

export const generateTelegramCaption = (
  product: Partial<ProductIntelligence>,
  affiliateLink: string,
  candidateScore?: number
): string => {
  // Format price in BRL (R$) if possible
  const price = typeof product.price === "number" && !isNaN(product.price)
    ? `R$ ${product.price.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "Consulte o preço";

  // Only show discount if > 0
  let discount = "";
  if (typeof product.discountPercent === "number" && product.discountPercent > 0) {
    discount = `🏷️ ${product.discountPercent.toFixed(0)}% OFF`;
  }

  // Human-friendly rating and sales
  const rating = typeof product.rating === "number" ? `⭐ ${product.rating.toFixed(1)}/5` : "⭐ Ótima escolha";
  const sales = typeof product.salesVolume === "number" ? `📦 ${product.salesVolume.toLocaleString()} vendidos` : "📦 Prova social";

  // Remove Telegram Candidate Score from caption

  const badgeLine = buildMarketplaceBadges(product)
    .map((badge) => badge.label)
    .slice(0, 3)
    .join(" • ");
  const title = escapeHtml(product.title || "Produto sem título");
  const link = escapeHtml(affiliateLink);

  // Friendly, inviting intro
  return [
    "🔥 Viral Tech Discovery",
    "",
    `<b>${title}</b>`,
    "",
    `💰 ${price}`,
    discount,
    `${rating} • ${sales}`,
    badgeLine ? `✨ ${badgeLine}` : "",
    "",
    `🔗 <a href=\"${link}\">Ver oferta no AliExpress</a>`
  ]
    .filter(Boolean)
    .join("\n");
};
