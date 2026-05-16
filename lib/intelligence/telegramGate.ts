/**
 * Quality gate for Telegram publication
 * 
 * Stricter requirements than dashboard:
 * - Score >= 65/100
 * - Rating >= 4.0/5
 * - Commission >= 8%
 * - Shipping <= 45 days
 * - No blocked categories
 */

import type { ProductIntelligence } from "./product-intelligence";
import { isBlockedCategory } from "./blockedCategories";

export type TelegramGateConfig = {
  minScore: number; // 0-100
  minRating: number; // 0-5
  minCommissionRate: number; // %
  maxShippingDays: number; // days
  requireVideo: boolean; // enforce video/high-quality images
};

export type TelegramGateResult = {
  approved: boolean;
  score: number;
  reasons: string[];
  warnings: string[];
};

/**
 * Strict Telegram gate configuration
 */
export const TELEGRAM_GATE_CONFIG: TelegramGateConfig = {
  minScore: 65, // Top 30-40% of products
  minRating: 4.0,
  minCommissionRate: 8,
  maxShippingDays: 45,
  requireVideo: false, // Optional but preferred
};

/**
 * Evaluate product against Telegram publication gate
 */
export const evaluateTelegramGate = (
  product: Partial<ProductIntelligence>,
  config: TelegramGateConfig = TELEGRAM_GATE_CONFIG
): TelegramGateResult => {
  const reasons: string[] = [];
  const warnings: string[] = [];
  let approved = true;

  // Check score (most important)
  if ((product.score ?? 0) < config.minScore) {
    reasons.push(`❌ score too low: ${product.score}/100 (min: ${config.minScore})`);
    approved = false;
  } else {
    reasons.push(`✅ quality score: ${product.score}/100`);
  }

  // Check rating
  if ((product.rating ?? 0) < config.minRating) {
    reasons.push(`❌ rating too low: ${(product.rating ?? 0).toFixed(2)}/5 (min: ${config.minRating})`);
    approved = false;
  } else {
    reasons.push(`✅ rating: ${(product.rating ?? 0).toFixed(2)}/5`);
  }

  // Check commission
  if ((product.commissionRate ?? 0) < config.minCommissionRate) {
    reasons.push(
      `❌ commission too low: ${(product.commissionRate ?? 0).toFixed(1)}% (min: ${config.minCommissionRate}%)`
    );
    approved = false;
  } else {
    reasons.push(`✅ commission: ${(product.commissionRate ?? 0).toFixed(1)}%`);
  }

  // Check shipping
  if ((product.shippingDays ?? 999) > config.maxShippingDays) {
    reasons.push(
      `❌ shipping too slow: ${product.shippingDays} days (max: ${config.maxShippingDays})`
    );
    approved = false;
  } else {
    reasons.push(`✅ fast shipping: ${product.shippingDays} days`);
  }

  // Check blocked category
  if (isBlockedCategory(product.categoryId)) {
    reasons.push(`❌ blocked category`);
    approved = false;
  }

  // Warnings (don't block, just alert)
  if (product.salesVolume && product.salesVolume < 100) {
    warnings.push(`⚠️ low sales volume: ${product.salesVolume} units`);
  }

  if (!product.hasVideo && config.requireVideo) {
    warnings.push(`⚠️ no video provided (preferred for CTR)`);
  }

  if (product.discountPercent && product.discountPercent > 75) {
    warnings.push(`⚠️ suspiciously high discount: ${product.discountPercent.toFixed(0)}%`);
  }

  return {
    approved,
    score: product.score ?? 0,
    reasons,
    warnings,
  };
};

/**
 * Filter products that pass Telegram gate
 */
export const filterForTelegram = (
  products: Partial<ProductIntelligence>[],
  config: TelegramGateConfig = TELEGRAM_GATE_CONFIG
): { approved: Partial<ProductIntelligence>[]; rejected: Partial<ProductIntelligence>[] } => {
  const approved: Partial<ProductIntelligence>[] = [];
  const rejected: Partial<ProductIntelligence>[] = [];

  for (const product of products) {
    const result = evaluateTelegramGate(product, config);
    if (result.approved) {
      approved.push(product);
    } else {
      rejected.push(product);
    }
  }

  return { approved, rejected };
};

/**
 * Get human-readable Telegram gate report
 */
export const getTelegramGateReport = (
  product: Partial<ProductIntelligence>,
  config: TelegramGateConfig = TELEGRAM_GATE_CONFIG
): string => {
  const result = evaluateTelegramGate(product, config);

  const lines: string[] = [
    `📱 Telegram Publication Gate Report`,
    `═`.repeat(50),
    "",
    `Product: ${product.title?.substring(0, 60)}...`,
    `Status: ${result.approved ? "✅ APPROVED" : "❌ REJECTED"}`,
    "",
    "Checks:",
    ...result.reasons,
  ];

  if (result.warnings.length > 0) {
    lines.push("", "Warnings:", ...result.warnings);
  }

  lines.push("");
  lines.push("Gate Requirements:");
  lines.push(`  • Min score: ${config.minScore}/100`);
  lines.push(`  • Min rating: ${config.minRating}/5`);
  lines.push(`  • Min commission: ${config.minCommissionRate}%`);
  lines.push(`  • Max shipping: ${config.maxShippingDays} days`);

  return lines.join("\n");
};

/**
 * Categorize product for Telegram channel section
 */
export const categorizeTelegramPost = (
  product: Partial<ProductIntelligence>
): {
  section: string;
  emoji: string;
  tier: "featured" | "standard" | "bonus";
} => {
  const score = product.score ?? 0;
  const rating = product.rating ?? 0;

  if (score >= 85 && rating >= 4.5) {
    return { section: "Featured Tech Deals", emoji: "🌟", tier: "featured" };
  }

  if (score >= 75 && rating >= 4.2) {
    return { section: "Hot Picks", emoji: "🔥", tier: "featured" };
  }

  if (score >= 65 && rating >= 4.0) {
    return { section: "Quality Gadgets", emoji: "✨", tier: "standard" };
  }

  return { section: "Bonus Finds", emoji: "💎", tier: "bonus" };
};

/**
 * Generate Telegram caption template with quality markers
 */
export const generateTelegramCaption = (
  product: Partial<ProductIntelligence>
): string => {
  const { section, emoji } = categorizeTelegramPost(product);
  const priceMatch = product.price ? `$${product.price.toFixed(2)}` : "Check Price";
  const discountText = product.discountPercent
    ? `${product.discountPercent.toFixed(0)}% OFF`
    : "Great Deal";
  const rating = product.rating ? `⭐ ${product.rating.toFixed(1)}/5` : "";

  return [
    `${emoji} ${section}`,
    ``,
    `**${product.title}**`,
    ``,
    `💰 ${priceMatch}`,
    `🏷️ ${discountText}`,
    rating,
    ``,
    `📊 Score: ${product.score}/100`,
    `✅ Verified Quality`,
  ]
    .filter((line) => line)
    .join("\n");
};
