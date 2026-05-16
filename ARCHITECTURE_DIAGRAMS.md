# System Architecture Diagram

## Data Flow Overview

```
                    AFFILIATE API
                   (AliExpress)
                         ↓
              [Raw Product Responses]
                         ↓
           ┌────────────────────────────┐
           │   SIGNAL EXTRACTION        │
           │ (signalExtractor.ts)       │
           │                            │
           │ • Parse affiliate metrics  │
           │ • Normalize formats        │
           │ • Calculate derived fields │
           └────────────────────────────┘
                         ↓
              [ExtractedSignals]
                         ↓
           ┌────────────────────────────┐
           │   QUALITY FILTERING        │
           │ (filterLowQuality.ts)      │
           │                            │
           │ • Check hard thresholds    │
           │ • Verify category          │
           │ • Evaluate shipping        │
           │ • Score quality 0-100      │
           └────────────────────────────┘
                         ↓
        ┌────────────────┴────────────────┐
        ↓                                  ↓
   [Rejected]                      [Quality Products]
        │                                  ↓
        │                      ┌──────────────────────┐
        │                      │  SCORING             │
        │                      │ (scoring.ts)         │
        │                      │                      │
        │                      │ Calculate:           │
        │                      │ • Sales score        │
        │                      │ • Rating score       │
        │                      │ • Discount score     │
        │                      │ • Commission score   │
        │                      │ • Category bonus     │
        │                      │ • Penalties          │
        │                      │ → Final 0-100 score  │
        │                      └──────────────────────┘
        │                                  ↓
        │                      ┌──────────────────────┐
        │                      │  RANKING             │
        │                      │ (product-intel...)  │
        │                      │                      │
        │                      │ Sort by score        │
        │                      │ Generate reasons     │
        │                      └──────────────────────┘
        │                                  ↓
        │                      [Ranked Products]
        │                         (sorted 0-100)
        │                                  ↓
        └──────────────────┬───────────────┴───────────────┐
                           ↓                               ↓
                    DASHBOARD MODE                  TELEGRAM MODE
                   (Quick rank, 50)             (Strict rank, 20)
                           ↓                               ↓
                      ┌─────────┐                   ┌──────────────┐
                      │Dashboard│                   │ Telegram Gate│
                      │ Display │                   │ (telegram.ts)│
                      │         │                   │              │
                      │ Score   │                   │ Verify:      │
                      │ Rating  │                   │ • Score 65+  │
                      │ Volume  │                   │ • Rating 4.0+│
                      │ Commission│                 │ • Commission │
                      └─────────┘                   │ • Shipping   │
                                                    │ • Category   │
                                                    └──────────────┘
                                                          ↓
                                                    ┌──────────────┐
                                                    │  ✅ Approved │
                                                    │  ❌ Rejected │
                                                    └──────────────┘
                                                          ↓
                                                   [Send to Telegram]
```

---

## Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   INTELLIGENCE LAYER                         │
│                  lib/intelligence/                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────┐  ┌──────────────────────────┐      │
│  │ Category System     │  │ Signal System            │      │
│  ├─────────────────────┤  ├──────────────────────────┤      │
│  │ • preferred         │  │ • extract              │      │
│  │ • blocked           │  │ • normalize            │      │
│  │                     │  │ • validate             │      │
│  └─────────────────────┘  └──────────────────────────┘      │
│                                                               │
│  ┌──────────────────────────────────────────────┐            │
│  │ Filtering System                             │            │
│  ├──────────────────────────────────────────────┤            │
│  │ • hard thresholds (reject/pass)             │            │
│  │ • soft warnings (log/continue)              │            │
│  │ • quality score calculation (0-100)         │            │
│  │ • batch filtering                           │            │
│  └──────────────────────────────────────────────┘            │
│                                                               │
│  ┌──────────────────────────────────────────────┐            │
│  │ Scoring System                               │            │
│  ├──────────────────────────────────────────────┤            │
│  │ • component scores (sales, rating, etc.)    │            │
│  │ • weighted composite (0-100)                │            │
│  │ • signal generation                         │            │
│  │ • reason generation                         │            │
│  └──────────────────────────────────────────────┘            │
│                                                               │
│  ┌──────────────────────────────────────────────┐            │
│  │ Pipeline System                              │            │
│  ├──────────────────────────────────────────────┤            │
│  │ • extract → filter → score → rank           │            │
│  │ • dashboard mode (quick, 50)                │            │
│  │ • telegram mode (strict, 20)                │            │
│  │ • custom config merging                     │            │
│  └──────────────────────────────────────────────┘            │
│                                                               │
│  ┌──────────────────────────────────────────────┐            │
│  │ Telegram Gate System                         │            │
│  ├──────────────────────────────────────────────┤            │
│  │ • strict thresholds                         │            │
│  │ • approval/rejection logic                  │            │
│  │ • section categorization                    │            │
│  │ • caption generation                        │            │
│  └──────────────────────────────────────────────┘            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Service Layer Integration

```
┌──────────────────────────────────────────────┐
│           lib/services.ts                    │
├──────────────────────────────────────────────┤
│                                              │
│  Original Methods:                           │
│  • getProducts()                             │
│  • getHotProducts()                          │
│  • getFeaturedProducts()                     │
│                                              │
│           ↓ [New Wrappers]                  │
│                                              │
│  Dashboard Ranking:                          │
│  • getProductsRanked()                       │
│  • getHotProductsRanked()                    │
│  • getFeaturedProductsRanked()               │
│                                              │
│  Telegram Ranking:                           │
│  • getProductsStrict()                       │
│  • getHotProductsStrict()                    │
│  • getFeaturedProductsStrict()               │
│                                              │
└──────────────────────────────────────────────┘
         ↓
    Intelligence Layer
         ↓
    Ranked Results
```

---

## API Route Flow

```
GET /api/aliexpress?type=products&ranked=true
         ↓
    Check ?ranked param
         ↓
    ┌────┴────┐
    ↓         ↓
  true      false
    ↓         ↓
[Ranked]  [Raw]
    ↓         ↓
    └────┬────┘
         ↓
   Response
```

---

## Telegram Send Flow

```
POST /api/send
{
  chatId, photoUrl, caption,
  product? (optional)
}
         ↓
    ┌────┴────────────────┐
    ↓                     ↓
product                 no product
provided?               data
    ↓                     ↓
 Check Gate          [Send immediately]
    ↓
 ├─ Score 65+?
 ├─ Rating 4.0+?
 ├─ Commission 8%+?
 ├─ Shipping 45 days?
 └─ Not blocked?
    ↓
 ┌──┴──┐
 ↓     ↓
✅    ❌
Send  Reject +
      Reasons
```

---

## Scoring Decision Tree

```
                    [Product]
                        ↓
         ┌──────────────┴──────────────┐
         ↓                             ↓
    Check Quality              Extract Signals
    Gates                            ↓
         ↓              [sales, rating, discount,
    ├─ Rating OK?        commission, category]
    ├─ Volume OK?
    ├─ Commission OK?             ↓
    ├─ Shipping OK?         Build Component
    └─ Not blocked?          Scores
         ↓                        ↓
    Pass/Fail           [salesScore, ratingScore,
         ↓              discountScore, commission...]
    
  ┌─────┴──────┐                 ↓
  ↓            ↓            Apply Weights
Reject    Continue         & Penalties
  ↓            ↓                ↓
 Low Q    Calculate        [Weighted Total]
 Score    Composite              ↓
          Score             Normalize
             ↓              (0-100)
        [0-100 Score]            ↓
             ↓           Final Score & Rank
```

---

## Configuration Hierarchy

```
┌──────────────────────────────────────┐
│     rankProductsPipeline()           │
│                                      │
│  scoreConfig (optional)              │
│  ├─ minRating                        │
│  ├─ idealDiscount                    │
│  ├─ weights...                       │
│                                      │
│  qualityConfig (optional)            │
│  ├─ minRating                        │
│  ├─ minVolume                        │
│  ├─ thresholds...                    │
│                                      │
│  applyQualityFilter (bool)           │
│  maxResults (number)                 │
└──────────────────────────────────────┘
         ↓
   Merge with Defaults
         ↓
┌──────────────────────────────────────┐
│  DEFAULT_SCORING_CONFIG              │
│  DEFAULT_QUALITY_GATES               │
└──────────────────────────────────────┘
         ↓
   Apply to Products
```

---

## Score Distribution Expected

```
Products Ranked by Score:

100%  ╭─────────────╮
      │ Rejected    │ ← Filtered out entirely
 80%  ├─────────────┤
      │ Marginal    │ ← Score 0-50 (dashboard only)
 60%  ├─────────────┤
      │ Fair        │ ← Score 50-65 (border cases)
 40%  ├─────────────┤
      │ Good        │ ← Score 65-80 (telegram possible)
 20%  ├─────────────┤
      │ Excellent   │ ← Score 80-100 (feature candidates)
  0%  ╰─────────────╯

For Telegram (strict gate, score 65+):
 keeps ~20-30% of raw catalog
 rejects ~70-80%
```

---

## Real Affiliate Metrics Used

```
Product API Response
    ↓
    ├─ lastest_volume ────────→ salesScore
    ├─ evaluate_rate ────────→ ratingScore
    ├─ discount ────────────→ discountScore
    ├─ commission_rate ─────→ commissionScore
    ├─ ship_to_days ────────→ shippingScore
    ├─ category_id ────────→ categoryBonus
    ├─ promo_code_info ────→ promoBonus
    └─ product_video_url ──→ qualityIndicator
    
    ↓
 [Final Score]
```

---

## Files at a Glance

```
lib/intelligence/
├── preferredCategories.ts    ← Tech whitelist (10 primary, 7 secondary)
├── blockedCategories.ts      ← Junk blacklist (7 categories)
├── signalExtractor.ts        ← Normalize API → signals
├── scoring.ts                ← Composite scoring (8 component scores)
├── filterLowQuality.ts       ← Quality gates (4 hard, 3 soft)
├── rankingPipeline.ts        ← Orchestrate extract→filter→score→rank
├── telegramGate.ts           ← Telegram quality gate (5 checks)
└── product-intelligence.ts   ← Core types & ranking (MODIFIED)

app/api/
├── aliexpress/route.ts       ← Support ?ranked parameter (MODIFIED)
└── send/route.ts             ← Add quality gate check (MODIFIED)

components/
└── product.tsx               ← Add quality badges (MODIFIED)

lib/
└── services.ts               ← Add 6 ranking methods (MODIFIED)
```

---

## Decision Boundaries

### What Gets Through (Dashboard)
```
rating >= 3.5
AND volume >= 50
AND commission >= 5%
AND shipping <= 60 days
AND NOT blocked_category
→ Show with score
```

### What Gets Through (Telegram)
```
score >= 65
AND rating >= 4.0
AND commission >= 8%
AND shipping <= 45 days
AND NOT blocked_category
→ Approved for publication
```

---

This is the complete system that improves your Telegram tech deals channel quality! 🚀
