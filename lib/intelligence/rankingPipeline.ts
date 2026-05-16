/**
 * Product ranking pipeline
 * 
 * Orchestrates the complete flow:
 * Raw Product API → Extract Signals → Filter Low Quality → Score & Rank → Sorted Results
 */

import type { ExtractedSignals } from "./signalExtractor";
import { extractSignalsFromProducts } from "./signalExtractor";
import { filterLowQuality, type QualityGateConfig, DEFAULT_QUALITY_GATES } from "./filterLowQuality";
import { scoreProduct, type ScoringConfig, DEFAULT_SCORING_CONFIG } from "./scoring";
import { rankProducts } from "./product-intelligence";
import type { ProductIntelligence } from "./product-intelligence";

export type RankingOptions = {
  scoreConfig?: Partial<ScoringConfig>;
  qualityConfig?: Partial<QualityGateConfig>;
  maxResults?: number;
  applyQualityFilter?: boolean;
};

export type RankingResult = {
  ranked: ProductIntelligence[];
  rejected: {
    product: ExtractedSignals;
    reason: string;
  }[];
  stats: {
    total: number;
    passed: number;
    rejected: number;
    topScore: number;
    averageScore: number;
  };
};

/**
 * Complete ranking pipeline:
 * 1. Extract normalized signals from raw products
 * 2. Filter out low-quality candidates
 * 3. Score each product
 * 4. Rank by composite score
 * 5. Return top N results with stats
 */
export const rankProductsPipeline = (
  rawProducts: any[],
  options: RankingOptions = {}
): RankingResult => {
  const {
    scoreConfig = DEFAULT_SCORING_CONFIG,
    qualityConfig = DEFAULT_QUALITY_GATES,
    maxResults = 100,
    applyQualityFilter = true,
  } = options;

  const mergedScoreConfig: ScoringConfig = {
    ...DEFAULT_SCORING_CONFIG,
    ...scoreConfig,
  };

  const mergedQualityConfig: QualityGateConfig = {
    ...DEFAULT_QUALITY_GATES,
    ...qualityConfig,
  };

  // Step 1: Extract signals
  const signals = extractSignalsFromProducts(rawProducts);

  // Step 2: Filter low-quality (optional)
  let candidateSignals = signals;
  let rejectedProducts: { product: ExtractedSignals; reason: string }[] = [];

  if (applyQualityFilter) {
    const filterResult = filterLowQuality(signals, mergedQualityConfig);
    candidateSignals = filterResult.quality;

    // Map rejections to rejected products
    rejectedProducts = filterResult.rejected.map((product) => {
      let reason = "unknown";

      if (product.rating < mergedQualityConfig.minRating) {
        reason = `rating too low (${product.rating.toFixed(2)}/5)`;
      } else if (product.salesVolume < mergedQualityConfig.minSalesVolume) {
        reason = `insufficient sales volume (${product.salesVolume} units)`;
      } else if (product.commissionRate < mergedQualityConfig.minCommissionRate) {
        reason = `commission too low (${product.commissionRate.toFixed(1)}%)`;
      } else if (product.shippingDays > mergedQualityConfig.maxShippingDays) {
        reason = `shipping too slow (${product.shippingDays} days)`;
      }

      return { product, reason };
    });
  }

  // Step 3: Score each candidate
  const scored = candidateSignals.map((signals) =>
    scoreProduct(signals, mergedScoreConfig)
  ) as ProductIntelligence[];

  // Step 4: Rank by score
  const ranked = rankProducts(scored);

  // Step 5: Limit results
  const topRanked = ranked.slice(0, maxResults);

  // Calculate stats
  const allScores = ranked.map((p) => p.score).filter((s) => s !== undefined);
  const stats = {
    total: rawProducts.length,
    passed: candidateSignals.length,
    rejected: rejectedProducts.length,
    topScore: allScores.length > 0 ? Math.max(...allScores) : 0,
    averageScore:
      allScores.length > 0
        ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
        : 0,
  };

  return {
    ranked: topRanked,
    rejected: rejectedProducts,
    stats,
  };
};

/**
 * Quick rank without quality filtering (dashboard preview mode)
 */
export const rankProductsQuick = (
  rawProducts: any[],
  maxResults: number = 50
): ProductIntelligence[] => {
  const result = rankProductsPipeline(rawProducts, {
    maxResults,
    applyQualityFilter: false,
  });
  return result.ranked;
};

/**
 * Strict rank for Telegram (high quality bar)
 */
export const rankProductsStrict = (
  rawProducts: any[],
  maxResults: number = 20
): ProductIntelligence[] => {
  const result = rankProductsPipeline(rawProducts, {
    maxResults,
    applyQualityFilter: true,
    qualityConfig: {
      minRating: 4.0, // Stricter
      minSalesVolume: 200, // Higher bar
      minCommissionRate: 8,
    },
  });
  return result.ranked;
};

/**
 * Get human-readable ranking report
 */
export const getRankingReport = (result: RankingResult): string => {
  const lines: string[] = [
    "🎯 Product Ranking Report",
    "═".repeat(50),
    "",
    "📊 Statistics:",
    `  Total products: ${result.stats.total}`,
    `  Passed quality filter: ${result.stats.passed}`,
    `  Rejected: ${result.stats.rejected}`,
    `  Final results: ${result.ranked.length}`,
    `  Top score: ${result.stats.topScore}/100`,
    `  Average score: ${result.stats.averageScore}/100`,
    "",
  ];

  if (result.ranked.length > 0) {
    lines.push("🏆 Top Products:");
    result.ranked.slice(0, 5).forEach((product, index) => {
      lines.push(
        `  ${index + 1}. [${product.score}] ${product.title?.substring(0, 50)}...`
      );
      if (product.reasons && product.reasons.length > 0) {
        product.reasons.slice(0, 2).forEach((reason) => {
          lines.push(`     • ${reason}`);
        });
      }
    });
  }

  if (result.rejected.length > 0) {
    lines.push("");
    lines.push("❌ Rejected Products (sample):");
    result.rejected.slice(0, 3).forEach((rejection) => {
      lines.push(
        `  • ${rejection.product.title?.substring(0, 40)}... → ${rejection.reason}`
      );
    });
  }

  return lines.join("\n");
};
