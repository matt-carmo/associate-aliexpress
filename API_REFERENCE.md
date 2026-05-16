# Intelligence Layer - API Reference

Complete reference for all new intelligence functions and types.

## Core Ranking

### `rankProductsPipeline(rawProducts, options)`
**Location**: `lib/intelligence/rankingPipeline.ts`

Complete ranking pipeline: extract → filter → score → rank

**Parameters**:
```typescript
{
  rawProducts: any[]           // Raw API responses
  options?: {
    scoreConfig?: Partial<ScoringConfig>
    qualityConfig?: Partial<QualityGateConfig>
    maxResults?: number         // Default: 100
    applyQualityFilter?: boolean // Default: true
  }
}
```

**Returns**:
```typescript
{
  ranked: ProductIntelligence[]
  rejected: { product: ExtractedSignals; reason: string }[]
  stats: {
    total: number
    passed: number
    rejected: number
    topScore: number
    averageScore: number
  }
}
```

**Example**:
```typescript
const result = rankProductsPipeline(products, {
  maxResults: 50,
  applyQualityFilter: true
});
console.log(`Processed: ${result.stats.total}, Top Score: ${result.stats.topScore}`);
```

---

### `rankProductsQuick(rawProducts, maxResults)`
**Location**: `lib/intelligence/rankingPipeline.ts`

Dashboard ranking: no hard filtering, shows diversity

**Parameters**:
```typescript
{
  rawProducts: any[]
  maxResults?: number // Default: 50
}
```

**Returns**: `ProductIntelligence[]`

---

### `rankProductsStrict(rawProducts, maxResults)`
**Location**: `lib/intelligence/rankingPipeline.ts`

Telegram ranking: strict quality gates

**Parameters**:
```typescript
{
  rawProducts: any[]
  maxResults?: number // Default: 20
}
```

**Returns**: `ProductIntelligence[]`

---

## Service Layer

### `getProductsRanked(params)`
**Location**: `lib/services.ts`

Query products with quality ranking (dashboard mode)

**Parameters**:
```typescript
{
  category_ids: string
  keywords?: string
  page_no: number
  sort: string
}
```

**Returns**: `Promise<ProductIntelligence[]>`

**Example**:
```typescript
const products = await getProductsRanked({
  category_ids: "100003109",
  keywords: "gaming",
  page_no: 1,
  sort: "SALE_PRICE_DESC"
});
```

---

### `getProductsStrict(params)`
**Location**: `lib/services.ts`

Query products with strict quality ranking (Telegram mode)

**Parameters**: Same as `getProductsRanked()`

**Returns**: `Promise<ProductIntelligence[]>`

---

### `getHotProductsRanked(params)` / `getHotProductsStrict(params)`
**Location**: `lib/services.ts`

Hot products with ranking

---

### `getFeaturedProductsRanked(params)` / `getFeaturedProductsStrict(params)`
**Location**: `lib/services.ts`

Featured/promo products with ranking

---

## Signal Extraction

### `extractSignals(product)`
**Location**: `lib/intelligence/signalExtractor.ts`

Extract normalized signals from single product

**Parameters**: `Partial<Product>` (raw API response)

**Returns**:
```typescript
{
  productId: number | string
  title: string
  imageUrl: string
  detailUrl: string
  categoryId: number | string
  categoryName: string
  shopId: number | string
  salePrice: number
  originalPrice: number
  discountPercent: number
  rating: number          // 0-5
  salesVolume: number
  commissionRate: number  // %
  shippingDays: number
  promoCode?: string
  hasVideo: boolean
  isHotProduct: boolean
  priceTier: "budget" | "mid" | "premium"
  volumeTier: "low" | "medium" | "high"
}
```

---

### `extractSignalsFromProducts(products)`
**Location**: `lib/intelligence/signalExtractor.ts`

Extract signals from multiple products

**Parameters**: `Partial<Product>[]`

**Returns**: `ExtractedSignals[]`

---

## Scoring

### `scoreProduct(signals, config)`
**Location**: `lib/intelligence/scoring.ts`

Score single product

**Parameters**:
```typescript
{
  signals: ExtractedSignals
  config?: ScoringConfig // Defaults to DEFAULT_SCORING_CONFIG
}
```

**Returns**: `Partial<ProductIntelligence>`

---

### `calculateCompositeScore(signals, config)`
**Location**: `lib/intelligence/scoring.ts`

Calculate final 0-100 score

**Parameters**: Same as `scoreProduct()`

**Returns**: `number` (0-100)

---

### `buildSignals(signals, config)`
**Location**: `lib/intelligence/scoring.ts`

Build signal record for scoring

**Returns**:
```typescript
{
  qualityRating: number
  salesMomentum: number
  commissionPotential: number
  categoryTechBonus: number
  shippingSpeed: number
  discountAttractiveness: number
  premiumForCheap: number
  visualHook: number
  // ... and more
}
```

---

## Quality Filtering

### `evaluateQuality(signals, config)`
**Location**: `lib/intelligence/filterLowQuality.ts`

Evaluate product against quality gates

**Parameters**:
```typescript
{
  signals: ExtractedSignals
  config?: QualityGateConfig
}
```

**Returns**:
```typescript
{
  passed: boolean
  score: number          // 0-100 quality score
  issues: string[]       // Hard fails
  warnings: string[]     // Soft warnings
  blocked: boolean
  blockReason?: string
}
```

---

### `filterLowQuality(products, config)`
**Location**: `lib/intelligence/filterLowQuality.ts`

Filter multiple products

**Parameters**:
```typescript
{
  products: ExtractedSignals[]
  config?: QualityGateConfig
}
```

**Returns**:
```typescript
{
  quality: ExtractedSignals[]
  rejected: ExtractedSignals[]
}
```

---

### `getQualityReport(signals, config)`
**Location**: `lib/intelligence/filterLowQuality.ts`

Human-readable quality report

**Returns**: `string`

---

## Categories

### `isPreferredCategory(categoryId)`
**Location**: `lib/intelligence/preferredCategories.ts`

Check if category is preferred (tech-first whitelist)

**Parameters**: `number | string | undefined`

**Returns**: `boolean`

---

### `getCategoryRelevanceScore(categoryId)`
**Location**: `lib/intelligence/preferredCategories.ts`

Get relevance score 0-10

**Parameters**: `number | string | undefined`

**Returns**: `number`

---

### `getCategoryTier(categoryId)`
**Location**: `lib/intelligence/preferredCategories.ts`

Get category tier

**Parameters**: `number | string | undefined`

**Returns**: `"primary" | "secondary" | "tertiary" | "none"`

---

### `isBlockedCategory(categoryId)`
**Location**: `lib/intelligence/blockedCategories.ts`

Check if category is blocked

**Parameters**: `number | string | undefined`

**Returns**: `boolean`

---

### `getBlockedReason(categoryId)`
**Location**: `lib/intelligence/blockedCategories.ts`

Get reason category is blocked

**Parameters**: `number | string | undefined`

**Returns**: `BlockedCategoryReason | null`

---

## Telegram Gate

### `evaluateTelegramGate(product, config)`
**Location**: `lib/intelligence/telegramGate.ts`

Check if product meets Telegram publication standards

**Parameters**:
```typescript
{
  product: Partial<ProductIntelligence>
  config?: TelegramGateConfig // Defaults to TELEGRAM_GATE_CONFIG
}
```

**Returns**:
```typescript
{
  approved: boolean
  score: number
  reasons: string[]
  warnings: string[]
}
```

**Example**:
```typescript
const gate = evaluateTelegramGate(product);
if (gate.approved) {
  // Safe to send to Telegram
  console.log(gate.reasons); // Why approved
} else {
  console.log(gate.reasons); // Why rejected
}
```

---

### `filterForTelegram(products, config)`
**Location**: `lib/intelligence/telegramGate.ts`

Filter batch of products

**Parameters**:
```typescript
{
  products: Partial<ProductIntelligence>[]
  config?: TelegramGateConfig
}
```

**Returns**:
```typescript
{
  approved: Partial<ProductIntelligence>[]
  rejected: Partial<ProductIntelligence>[]
}
```

---

### `getTelegramGateReport(product, config)`
**Location**: `lib/intelligence/telegramGate.ts`

Human-readable gate report

**Returns**: `string`

---

### `categorizeTelegramPost(product)`
**Location**: `lib/intelligence/telegramGate.ts`

Categorize product for Telegram channel section

**Returns**:
```typescript
{
  section: string      // "Featured Tech Deals" | "Hot Picks" | etc.
  emoji: string        // "🌟" | "🔥" | "✨" | "💎"
  tier: "featured" | "standard" | "bonus"
}
```

---

### `generateTelegramCaption(product)`
**Location**: `lib/intelligence/telegramGate.ts`

Generate caption template for Telegram post

**Returns**: `string`

**Example Output**:
```
🌟 Featured Tech Deals

**RGB USB-C Gaming Mouse**

💰 $19.99
🏷️ 45% OFF
⭐ 4.5/5

📊 Score: 78/100
✅ Verified Quality
```

---

## Types

### `ProductIntelligence`
```typescript
{
  productId: number | string
  title: string
  imageUrl: string
  detailUrl?: string
  categoryId?: number | string
  categoryName?: string
  shopId?: number | string
  price?: number
  originalPrice?: number
  discountPercent?: number
  rating?: number          // 0-5
  salesVolume?: number
  commissionRate?: number  // %
  shippingDays?: number
  promoCode?: string
  isHotProduct?: boolean
  hasVideo?: boolean
  signals: Record<IntelligenceSignalName, number>
  score: number            // 0-100
  reasons: string[]
}
```

---

### `ExtractedSignals`
```typescript
{
  productId: number | string
  title: string
  imageUrl: string
  detailUrl: string
  categoryId: number | string
  categoryName: string
  shopId: number | string
  salePrice: number
  originalPrice: number
  discountPercent: number
  rating: number           // 0-5
  salesVolume: number
  commissionRate: number   // %
  shippingDays: number
  promoCode?: string
  hasVideo: boolean
  isHotProduct: boolean
  priceTier: "budget" | "mid" | "premium"
  volumeTier: "low" | "medium" | "high"
}
```

---

### `QualityGateConfig`
```typescript
{
  minRating: number              // Default: 3.5
  minSalesVolume: number         // Default: 50
  minCommissionRate: number      // Default: 5
  maxShippingDays: number        // Default: 60
  maxSuspiciousDiscount: number  // Default: 80
  warnOnLowRating: number
  warnOnLowVolume: number
  warnOnLowCommission: number
}
```

---

### `ScoringConfig`
```typescript
{
  minRating: number                      // Default: 3.5
  minSalesVolume: number                 // Default: 50
  minCommissionRate: number              // Default: 5
  maxShippingDays: number                // Default: 60
  idealDiscountMin: number               // Default: 10
  idealDiscountMax: number               // Default: 60
  highSalesVolumeThreshold: number       // Default: 500
  premiumPriceThreshold: number          // Default: 150
  salesScoreWeight: number               // Default: 2.5
  ratingScoreWeight: number              // Default: 2.0
  discountScoreWeight: number            // Default: 1.8
  commissionScoreWeight: number          // Default: 1.5
  categoryBonusWeight: number            // Default: 1.2
  videoBonus: number                     // Default: 0.5
  hotProductBonus: number                // Default: 0.8
  saturationPenaltyWeight: number        // Default: 1.5
  genericnessPenaltyWeight: number       // Default: 1.3
  shippingPenaltyWeight: number          // Default: 0.6
}
```

---

### `TelegramGateConfig`
```typescript
{
  minScore: number           // Default: 65/100
  minRating: number          // Default: 4.0/5
  minCommissionRate: number  // Default: 8%
  maxShippingDays: number    // Default: 45
  requireVideo: boolean      // Default: false
}
```

---

## Constants

### Preferred Categories
**Location**: `lib/intelligence/preferredCategories.ts`

```typescript
PREFERRED_CATEGORIES: CategoryRelevance[]
categoryScoreMap: Map<number | string, number>
```

### Blocked Categories
**Location**: `lib/intelligence/blockedCategories.ts`

```typescript
BLOCKED_CATEGORIES: BlockedCategory[]
blockedCategoryMap: Map<number | string, BlockedCategoryReason>
```

### Default Configs
**Location**: Various files

```typescript
DEFAULT_SCORING_CONFIG: ScoringConfig
DEFAULT_QUALITY_GATES: QualityGateConfig
TELEGRAM_GATE_CONFIG: TelegramGateConfig
```

---

## Reporting

### `getRankingReport(result)`
**Location**: `lib/intelligence/rankingPipeline.ts`

Human-readable ranking report

**Example Output**:
```
🎯 Product Ranking Report
══════════════════════════════════════════════════

📊 Statistics:
  Total products: 234
  Passed quality filter: 189
  Rejected: 45
  Final results: 50
  Top score: 92/100
  Average score: 71/100

🏆 Top Products:
  1. [92] RGB USB-C Gaming Mouse...
     • strong visual hook
     • excellent rating
  ...
```

---

## Quick Copy-Paste Snippets

### Dashboard: Show Ranked Products
```typescript
const ranked = await getProductsRanked({
  category_ids: "100003109",
  page_no: 1,
  sort: "SALE_PRICE_DESC"
});

return {
  product: ranked.map(p => ({
    ...p,
    score: p.score,
    rating: p.rating,
    salesVolume: p.salesVolume
  }))
};
```

### Telegram: Strict Quality Only
```typescript
const telegram = await getProductsStrict({
  category_ids: "100003109",
  page_no: 1,
  sort: "SALE_PRICE_DESC"
});

return telegram;
```

### Check Individual Product
```typescript
const { evaluate_rate, lastest_volume, commission_rate } = product;
const signals = extractSignals(product);
const quality = evaluateQuality(signals);
const gate = evaluateTelegramGate(product);

console.log(`Quality: ${quality.score}/100 | Gate: ${gate.approved ? "✅" : "❌"}`);
```

---

**For more details, see `IMPLEMENTATION_SUMMARY.md`**
