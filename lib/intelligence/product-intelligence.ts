/**
 * CTR-first scoring signals for Telegram appeal
 * Based on real AliExpress affiliate API metrics
 */
export type IntelligenceSignalName =
  | "visualHook"
  | "thumbStopping"
  | "impulseBuy"
  | "oneGlanceComprehension"
  | "shareability"
  | "emotionalTrigger"
  | "discountAttractiveness"
  | "uniqueness"
  | "curiosity"
  | "visualUtility"
  | "premiumForCheap"
  | "saturationRisk"
  | "genericness"
  | "longExplanationRisk"
  | "qualityRating"
  | "salesMomentum"
  | "commissionPotential"
  | "categoryTechBonus"
  | "shippingSpeed";

export type ProductIntelligence = {
  // Raw product data from AliExpress
  productId: number | string;
  title: string;
  imageUrl: string;
  detailUrl?: string;
  categoryId?: number | string;
  categoryName?: string;
  shopId?: number | string;

  // Pricing from affiliate API
  price?: number; // sale price
  originalPrice?: number;
  discountPercent?: number;

  // Quality metrics (real AliExpress data)
  rating?: number; // evaluate_rate (0-5)
  salesVolume?: number; // lastest_volume
  commissionRate?: number; // commission_rate (%)
  shippingDays?: number; // ship_to_days

  // Promotional signals
  promoCode?: string;
  isHotProduct?: boolean;
  hasVideo?: boolean;

  // Intelligence scoring
  signals: Record<IntelligenceSignalName, number>;
  score: number; // 0-100
  reasons: string[];
};

export const createEmptySignals = (): Record<IntelligenceSignalName, number> => ({
  visualHook: 0,
  thumbStopping: 0,
  impulseBuy: 0,
  oneGlanceComprehension: 0,
  shareability: 0,
  emotionalTrigger: 0,
  discountAttractiveness: 0,
  uniqueness: 0,
  curiosity: 0,
  visualUtility: 0,
  premiumForCheap: 0,
  saturationRisk: 0,
  genericness: 0,
  longExplanationRisk: 0,
  qualityRating: 0,
  salesMomentum: 0,
  commissionPotential: 0,
  categoryTechBonus: 0,
  shippingSpeed: 0,
});

export const rankProducts = (products: Array<Partial<ProductIntelligence>>) => {
  return products
    .map((product) => {
      const signals = { ...createEmptySignals(), ...(product.signals ?? {}) };

      // Weighted scoring for Telegram CTR appeal
      // Real affiliate metrics heavily influence final score
      const weightedScore =
        // Visual & engagement signals (CTR drivers)
        signals.visualHook * 1.6 +
        signals.thumbStopping * 1.6 +
        signals.impulseBuy * 1.4 +
        signals.oneGlanceComprehension * 1.2 +
        signals.shareability * 1.1 +
        signals.emotionalTrigger * 1.4 +
        signals.curiosity * 1.3 +
        signals.visualUtility * 1.1 +
        // Quality signals (affiliate API metrics)
        signals.qualityRating * 1.5 +
        signals.salesMomentum * 1.3 +
        signals.commissionPotential * 1.0 +
        signals.categoryTechBonus * 1.2 +
        signals.shippingSpeed * 0.8 +
        // Pricing signals
        signals.discountAttractiveness * 1.2 +
        signals.premiumForCheap * 1.2 +
        signals.uniqueness * 1.0 -
        // Risk penalties
        signals.saturationRisk * 1.7 -
        signals.genericness * 1.6 -
        signals.longExplanationRisk * 1.3;

      const reasons: string[] = [];
      
      // Visual appeal (CTR)
      if (signals.visualHook >= 7) reasons.push("strong visual hook");
      if (signals.thumbStopping >= 7) reasons.push("thumb-stopping design");
      if (signals.impulseBuy >= 7) reasons.push("high impulse-buy appeal");
      if (signals.curiosity >= 7) reasons.push("curiosity-driven");
      
      // Quality (affiliate API)
      if (signals.qualityRating >= 8) reasons.push("excellent rating");
      if (signals.salesMomentum >= 8) reasons.push("proven sales traction");
      if (signals.commissionPotential >= 7) reasons.push("strong affiliate earnings");
      if (signals.categoryTechBonus >= 7) reasons.push("tech category match");
      
      // Pricing
      if (signals.discountAttractiveness >= 8) reasons.push("attractive discount");
      if (signals.premiumForCheap >= 8) reasons.push("premium for cheap");
      
      // Risks
      if (signals.saturationRisk >= 7) reasons.push("⚠️ saturation risk");
      if (signals.genericness >= 7) reasons.push("⚠️ generic product");
      if (signals.longExplanationRisk >= 7)
        reasons.push("⚠️ needs explanation");

      const score = Math.max(0, Math.min(100, Math.round(weightedScore * 10)));

      return {
        ...product,
        signals,
        score,
        reasons,
      } as ProductIntelligence;
    })
    .sort((left, right) => right.score - left.score);
};