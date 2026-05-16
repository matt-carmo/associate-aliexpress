/**
 * Quality gates & low-quality product filtering
 * 
 * Removes products that don't meet minimum standards:
 * - Poor ratings (< 3.5)
 * - Low sales volume (< 50 units)
 * - Low commission rate (< 5%)
 * - Slow shipping (> 60 days)
 * - Blocked categories
 * - Suspicious discounts (> 80%)
 */

import type { ExtractedSignals } from "./signalExtractor";
import { isBlockedCategory, getBlockedReason } from "./blockedCategories";

export type QualityGateConfig = {
  // Hard minimum thresholds (product rejected if below)
  minRating: number; // 0-5 scale
  minSalesVolume: number; // units
  minCommissionRate: number; // %
  maxShippingDays: number; // days
  maxSuspiciousDiscount: number; // %, above this = suspicious

  // Soft filters (logged but not rejected)
  warnOnLowRating: number;
  warnOnLowVolume: number;
  warnOnLowCommission: number;
};

export type QualityGateResult = {
  passed: boolean;
  score: number; // 0-100 quality score
  issues: string[];
  warnings: string[];
  blocked: boolean;
  blockReason?: string;
};

/**
 * Default gates tuned for Telegram tech deals
 */
export const DEFAULT_QUALITY_GATES: QualityGateConfig = {
  // Hard requirements
  minRating: 3.5,
  minSalesVolume: 50,
  minCommissionRate: 5,
  maxShippingDays: 60,
  maxSuspiciousDiscount: 80,

  // Soft warnings
  warnOnLowRating: 4.0,
  warnOnLowVolume: 200,
  warnOnLowCommission: 10,
};

/**
 * Check if product is in blocked category
 */
const checkBlockedCategory = (signals: ExtractedSignals): [boolean, string | null] => {
  if (isBlockedCategory(signals.categoryId)) {
    const reason = getBlockedReason(signals.categoryId);
    return [true, reason || "blocked category"];
  }
  return [false, null];
};

/**
 * Check rating quality
 */
const checkRating = (
  rating: number,
  config: QualityGateConfig
): { passed: boolean; issues: string[]; warnings: string[] } => {
  const issues: string[] = [];
  const warnings: string[] = [];

  if (rating < config.minRating) {
    issues.push(`rating too low: ${rating.toFixed(2)}/5 (min: ${config.minRating})`);
  }

  if (rating < config.warnOnLowRating) {
    warnings.push(`low rating: ${rating.toFixed(2)}/5`);
  }

  return { passed: issues.length === 0, issues, warnings };
};

/**
 * Check sales volume quality
 */
const checkSalesVolume = (
  volume: number,
  config: QualityGateConfig
): { passed: boolean; issues: string[]; warnings: string[] } => {
  const issues: string[] = [];
  const warnings: string[] = [];

  if (volume < config.minSalesVolume) {
    issues.push(
      `sales volume too low: ${volume} units (min: ${config.minSalesVolume})`
    );
  }

  if (volume < config.warnOnLowVolume) {
    warnings.push(`low sales traction: ${volume} units`);
  }

  return { passed: issues.length === 0, issues, warnings };
};

/**
 * Check commission rate quality
 */
const checkCommissionRate = (
  rate: number,
  config: QualityGateConfig
): { passed: boolean; issues: string[]; warnings: string[] } => {
  const issues: string[] = [];
  const warnings: string[] = [];

  if (rate < config.minCommissionRate) {
    issues.push(
      `commission too low: ${rate.toFixed(1)}% (min: ${config.minCommissionRate}%)`
    );
  }

  if (rate < config.warnOnLowCommission) {
    warnings.push(`low commission: ${rate.toFixed(1)}%`);
  }

  return { passed: issues.length === 0, issues, warnings };
};

/**
 * Check shipping speed
 */
const checkShipping = (
  days: number,
  config: QualityGateConfig
): { passed: boolean; issues: string[] } => {
  const issues: string[] = [];

  if (days > config.maxShippingDays) {
    issues.push(
      `shipping too slow: ${days} days (max: ${config.maxShippingDays})`
    );
  }

  return { passed: issues.length === 0, issues };
};

/**
 * Check for suspicious discounts
 */
const checkDiscount = (
  discountPercent: number,
  config: QualityGateConfig
): { passed: boolean; issues: string[] } => {
  const issues: string[] = [];

  if (discountPercent > config.maxSuspiciousDiscount) {
    issues.push(
      `suspiciously high discount: ${discountPercent.toFixed(0)}% (max trust: ${config.maxSuspiciousDiscount}%)`
    );
  }

  return { passed: issues.length === 0, issues };
};

/**
 * Calculate quality score (0-100)
 */
const calculateQualityScore = (
  signals: ExtractedSignals,
  config: QualityGateConfig
): number => {
  let score = 100;

  // Deduct for each failing gate
  if (signals.rating < config.minRating) score -= 40;
  if (signals.salesVolume < config.minSalesVolume) score -= 30;
  if (signals.commissionRate < config.minCommissionRate) score -= 20;
  if (signals.shippingDays > config.maxShippingDays) score -= 15;
  if (signals.discountPercent > config.maxSuspiciousDiscount) score -= 25;

  // Deduct for warnings
  if (signals.rating < config.warnOnLowRating) score -= 5;
  if (signals.salesVolume < config.warnOnLowVolume) score -= 5;
  if (signals.commissionRate < config.warnOnLowCommission) score -= 3;

  return Math.max(0, score);
};

/**
 * Evaluate product against quality gates
 */
export const evaluateQuality = (
  signals: ExtractedSignals,
  config: QualityGateConfig = DEFAULT_QUALITY_GATES
): QualityGateResult => {
  const issues: string[] = [];
  const warnings: string[] = [];
  let passed = true;

  // Check for blocked category (hard fail)
  const [isBlocked, blockReason] = checkBlockedCategory(signals);
  if (isBlocked) {
    return {
      passed: false,
      score: 0,
      issues: [`blocked category: ${blockReason}`],
      warnings: [],
      blocked: true,
      blockReason: blockReason || undefined,
    };
  }

  // Check rating
  const ratingCheck = checkRating(signals.rating, config);
  issues.push(...ratingCheck.issues);
  warnings.push(...ratingCheck.warnings);
  if (!ratingCheck.passed) passed = false;

  // Check sales volume
  const volumeCheck = checkSalesVolume(signals.salesVolume, config);
  issues.push(...volumeCheck.issues);
  warnings.push(...volumeCheck.warnings);
  if (!volumeCheck.passed) passed = false;

  // Check commission rate
  const commissionCheck = checkCommissionRate(signals.commissionRate, config);
  issues.push(...commissionCheck.issues);
  warnings.push(...commissionCheck.warnings);
  if (!commissionCheck.passed) passed = false;

  // Check shipping
  const shippingCheck = checkShipping(signals.shippingDays, config);
  issues.push(...shippingCheck.issues);
  if (!shippingCheck.passed) passed = false;

  // Check discount (suspicious = warning only)
  const discountCheck = checkDiscount(signals.discountPercent, config);
  if (discountCheck.issues.length > 0) {
    warnings.push(...discountCheck.issues); // Warnings, not blockers
  }

  const score = calculateQualityScore(signals, config);

  return {
    passed,
    score,
    issues,
    warnings,
    blocked: false,
  };
};

/**
 * Filter out low-quality products
 */
export const filterLowQuality = (
  products: ExtractedSignals[],
  config: QualityGateConfig = DEFAULT_QUALITY_GATES
): { quality: ExtractedSignals[]; rejected: ExtractedSignals[] } => {
  const quality: ExtractedSignals[] = [];
  const rejected: ExtractedSignals[] = [];

  for (const product of products) {
    const result = evaluateQuality(product, config);
    if (result.passed) {
      quality.push(product);
    } else {
      rejected.push(product);
    }
  }

  return { quality, rejected };
};

/**
 * Get human-readable quality report for a product
 */
export const getQualityReport = (
  signals: ExtractedSignals,
  config: QualityGateConfig = DEFAULT_QUALITY_GATES
): string => {
  const result = evaluateQuality(signals, config);

  const lines: string[] = [
    `📊 Quality Report: ${signals.title}`,
    `Score: ${result.score}/100 | ${result.passed ? "✅ PASS" : "❌ FAIL"}`,
    "",
    "Metrics:",
    `  Rating: ${signals.rating.toFixed(2)}/5 (min: ${config.minRating})`,
    `  Sales: ${signals.salesVolume} units (min: ${config.minSalesVolume})`,
    `  Commission: ${signals.commissionRate.toFixed(1)}% (min: ${config.minCommissionRate}%)`,
    `  Shipping: ${signals.shippingDays} days (max: ${config.maxShippingDays})`,
    `  Discount: ${signals.discountPercent.toFixed(0)}%`,
  ];

  if (result.issues.length > 0) {
    lines.push("", "Issues:");
    result.issues.forEach((issue) => lines.push(`  ❌ ${issue}`));
  }

  if (result.warnings.length > 0) {
    lines.push("", "Warnings:");
    result.warnings.forEach((warning) => lines.push(`  ⚠️ ${warning}`));
  }

  return lines.join("\n");
};
