/**
 * Composite product scoring using real AliExpress affiliate metrics
 * 
 * Scoring formula:
 * score = salesScore + ratingScore + discountScore + commissionScore 
 *         + techCategoryBonus + videoBonus + hotProductBonus 
 *         - saturationPenalty - genericnessPenalty - shippingPenalty
 * 
 * Final score: 0-100 (higher = better for Telegram)
 */

import type { ExtractedSignals } from "./signalExtractor";
import { getCategoryRelevanceScore } from "./preferredCategories";
import type { IntelligenceSignalName, ProductIntelligence } from "./product-intelligence.ts";

export type ScoringConfig = {
  // Minimum thresholds (products below are penalized heavily)
  minRating: number; // 0-5
  minSalesVolume: number; // units
  minCommissionRate: number; // %
  maxShippingDays: number; // days

  // Sweet spots (optimal ranges for scoring)
  idealDiscountMin: number; // %
  idealDiscountMax: number; // %
  highSalesVolumeThreshold: number; // units for "high"
  premiumPriceThreshold: number; // $ for "premium"

  // Weighting multipliers
  salesScoreWeight: number;
  ratingScoreWeight: number;
  discountScoreWeight: number;
  commissionScoreWeight: number;
  categoryBonusWeight: number;
  videoBonus: number;
  hotProductBonus: number;
  saturationPenaltyWeight: number;
  genericnessPenaltyWeight: number;
  shippingPenaltyWeight: number;
};

/**
 * Default config tuned for Telegram tech deals channel
 */
export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  minRating: 3.5,
  minSalesVolume: 50,
  minCommissionRate: 5,
  maxShippingDays: 60,

  idealDiscountMin: 10,
  idealDiscountMax: 60,
  highSalesVolumeThreshold: 500,
  premiumPriceThreshold: 150,

  // Weights (sum should be ~10 for easy tuning)
  salesScoreWeight: 2.5,
  ratingScoreWeight: 2.0,
  discountScoreWeight: 1.8,
  commissionScoreWeight: 1.5,
  categoryBonusWeight: 1.2,
  videoBonus: 0.5,
  hotProductBonus: 0.8,
  saturationPenaltyWeight: 1.5,
  genericnessPenaltyWeight: 1.3,
  shippingPenaltyWeight: 0.6,
};

/**
 * Calculate sales score (0-10)
 * Rewards high volume, penalizes low volume
 */
const calculateSalesScore = (
  salesVolume: number,
  config: ScoringConfig
): number => {
  if (salesVolume < config.minSalesVolume) return 0; // Fail fast
  if (salesVolume >= config.highSalesVolumeThreshold) return 10;
  
  // Linear interpolation between min and high threshold
  const normalized = (salesVolume - config.minSalesVolume) / 
    (config.highSalesVolumeThreshold - config.minSalesVolume);
  return Math.min(10, normalized * 10);
};

/**
 * Calculate rating score (0-10)
 * Rewards high ratings, penalizes low ratings
 */
const calculateRatingScore = (
  rating: number,
  config: ScoringConfig
): number => {
  if (rating < config.minRating) return 0; // Fail fast
  if (rating >= 4.8) return 10; // Excellent
  if (rating >= 4.5) return 9;
  if (rating >= 4.0) return 8;
  if (rating >= 3.7) return 6;
  
  return Math.max(0, (rating - config.minRating) * 5);
};

/**
 * Calculate discount score (0-10)
 * Sweet spot: 10-60%, penalizes both too-low and suspicious discounts
 */
const calculateDiscountScore = (
  discountPercent: number,
  config: ScoringConfig
): number => {
  // Too low discount = boring
  if (discountPercent < config.idealDiscountMin) {
    return discountPercent / config.idealDiscountMin * 3; // Max 3 points
  }
  
  // Sweet spot (ideal range)
  if (discountPercent <= config.idealDiscountMax) {
    return 10; // Full points in ideal range
  }
  
  // Too high discount = suspicious (fake/clearance)
  const excessDiscount = discountPercent - config.idealDiscountMax;
  const penaltyPerPercent = 0.1; // 1% over ideal = -0.1 points
  return Math.max(3, 10 - excessDiscount * penaltyPerPercent);
};

/**
 * Calculate commission score (0-10)
 * Rewards high commission rates (better earnings)
 */
const calculateCommissionScore = (
  commissionRate: number,
  config: ScoringConfig
): number => {
  if (commissionRate < config.minCommissionRate) return 0; // Fail fast
  if (commissionRate >= 15) return 10; // Excellent
  if (commissionRate >= 10) return 8;
  
  // Linear for 5-10%
  return ((commissionRate - config.minCommissionRate) / 
    (10 - config.minCommissionRate)) * 8;
};

/**
 * Calculate category bonus (0-10)
 * Rewards tech-first categories
 */
const calculateCategoryBonus = (
  categoryId: number | string | undefined
): number => {
  if (!categoryId) return 0;
  const score = getCategoryRelevanceScore(categoryId);
  return (score / 10) * 10; // Scale to 0-10
};

/**
 * Calculate shipping score (0-10)
 * Rewards fast shipping
 */
const calculateShippingScore = (
  shippingDays: number,
  config: ScoringConfig
): number => {
  if (shippingDays > config.maxShippingDays) return 0; // Fail fast
  if (shippingDays <= 10) return 10; // Fast!
  if (shippingDays <= 20) return 8;
  if (shippingDays <= 30) return 6;
  
  // Linear falloff
  return Math.max(0, 10 - (shippingDays - 30) * 0.2);
};

/**
 * Calculate saturation penalty (0-10)
 * Penalizes extremely high volume products (likely already shared everywhere)
 */
const calculateSaturationPenalty = (
  salesVolume: number
): number => {
  // Products with insanely high volume are probably worn out
  if (salesVolume > 100000) return 10; // Fully penalized
  if (salesVolume > 50000) return 7;
  if (salesVolume > 10000) return 4;
  
  return 0;
};

/**
 * Calculate genericness penalty (0-10)
 * Penalizes products with generic titles
 */
const calculateGenericnessPenalty = (title: string): number => {
  const lowerTitle = title.toLowerCase();
  
  const genericKeywords = [
    "multifunction",
    "universal",
    "general",
    "item",
    "product",
    "cable",
    "charger",
    "cover",
  ];

  let penalty = 0;
  for (const keyword of genericKeywords) {
    if (lowerTitle.includes(keyword)) penalty += 2;
  }
  
  // Generic if title is too short or too long
  if (title.length < 15) penalty += 3;
  if (title.length > 150) penalty += 2;
  
  return Math.min(10, penalty);
};

/**
 * Build complete signal record from extracted signals
 */
export const buildSignals = (
  signals: ExtractedSignals,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG
): Record<string, number> => {
  const salesScore = calculateSalesScore(signals.salesVolume, config);
  const ratingScore = calculateRatingScore(signals.rating, config);
  const discountScore = calculateDiscountScore(signals.discountPercent, config);
  const commissionScore = calculateCommissionScore(signals.commissionRate, config);
  const categoryBonus = calculateCategoryBonus(signals.categoryId);
  const shippingScore = calculateShippingScore(signals.shippingDays, config);
  const saturationPenalty = calculateSaturationPenalty(signals.salesVolume);
  const genericnessPenalty = calculateGenericnessPenalty(signals.title);

  return {
    // Affiliate metrics (real data)
    qualityRating: ratingScore,
    salesMomentum: salesScore,
    commissionPotential: commissionScore,
    shippingSpeed: shippingScore,
    categoryTechBonus: categoryBonus,

    // Pricing & discount
    discountAttractiveness: discountScore,
    premiumForCheap: signals.priceTier === "premium" && discountScore > 7 ? 8 : 0,

    // Promotional signals
    visualHook: signals.hasVideo ? 5 : 0, // Video provides hook
    thumbStopping: 0, // Determined by image (not in API)
    impulseBuy: discountScore > 8 ? 7 : 0,
    oneGlanceComprehension: 0, // Determined by image/title clarity
    shareability: signals.isHotProduct ? 6 : 0,
    emotionalTrigger: 0, // Determined by image/category
    uniqueness: signals.volumeTier === "low" ? 6 : 0, // Novelty bonus
    curiosity: 0, // Determined by image/title
    visualUtility: 0, // Determined by image
    saturationRisk: saturationPenalty,
    genericness: genericnessPenalty,
    longExplanationRisk: genericnessPenalty > 5 ? 5 : 0,
  };
};

/**
 * Calculate composite score (0-100) from signals and config
 */
export const calculateCompositeScore = (
  signals: ExtractedSignals,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG
): number => {
  const signalRecord = buildSignals(signals, config);

  const weightedTotal =
    (signalRecord.qualityRating || 0) * config.ratingScoreWeight +
    (signalRecord.salesMomentum || 0) * config.salesScoreWeight +
    (signalRecord.discountAttractiveness || 0) * config.discountScoreWeight +
    (signalRecord.commissionPotential || 0) * config.commissionScoreWeight +
    (signalRecord.categoryTechBonus || 0) * config.categoryBonusWeight +
    (signalRecord.shippingSpeed || 0) * (config.maxShippingDays > 0 ? 0.4 : 0) +
    (signals.hasVideo ? config.videoBonus : 0) +
    (signals.isHotProduct ? config.hotProductBonus : 0) -
    (signalRecord.saturationRisk || 0) * config.saturationPenaltyWeight -
    (signalRecord.genericness || 0) * config.genericnessPenaltyWeight;

  // Normalize to 0-100 (sum of weights is typically ~10-11)
  const normalizedScore = (weightedTotal / 12) * 100;
  return Math.max(0, Math.min(100, Math.round(normalizedScore)));
};

/**
 * Score a single product
 */
export const scoreProduct = (
  signals: ExtractedSignals,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG
): Partial<ProductIntelligence> => {
  const signalRecord = buildSignals(signals, config);
  const score = calculateCompositeScore(signals, config);

  return {
    productId: signals.productId,
    title: signals.title,
    imageUrl: signals.imageUrl,
    detailUrl: signals.detailUrl,
    categoryId: signals.categoryId,
    categoryName: signals.categoryName,
    shopId: signals.shopId,
    price: signals.salePrice,
    originalPrice: signals.originalPrice,
    discountPercent: signals.discountPercent,
    rating: signals.rating,
    salesVolume: signals.salesVolume,
    commissionRate: signals.commissionRate,
    shippingDays: signals.shippingDays,
    promoCode: signals.promoCode,
    isHotProduct: signals.isHotProduct,
    hasVideo: signals.hasVideo,
    signals: signalRecord as Record<string, number>,
    score,
    reasons: [],
  };
};
