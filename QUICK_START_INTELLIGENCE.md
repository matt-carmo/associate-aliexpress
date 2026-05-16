# Quick Start: Intelligence Layer

## For Dashboard Users

### View Ranked Products
Products now display quality badges:
- **🌟 Excellent** (80+/100) - Best Telegram candidates
- **✨ Good** (65-79) - Quality picks
- **👍 Fair** (50-64) - Decent products

Hover over the badges to see:
- Quality score breakdown
- Rating details
- Sales volume
- Affiliate commission

### API: Get Ranked Results
```bash
# Get ranked products (top 50, light filtering)
GET /api/aliexpress?type=products&ranked=true&category_ids=100003109&page_no=1

# Raw products (original behavior, no filtering)
GET /api/aliexpress?type=products&category_ids=100003109&page_no=1

# Same for hot products
GET /api/aliexpress?type=hot-products&ranked=true&...

# Same for featured
GET /api/aliexpress?type=featured-products&ranked=true&...
```

---

## For Telegram Operations

### Use Strict Mode (High Quality)
```typescript
import { getProductsStrict, getHotProductsStrict } from "@/lib/services";

// Get only top-quality candidates for Telegram
const products = await getProductsStrict({
  category_ids: "100003109",
  page_no: 1,
  sort: "SALE_PRICE_DESC"
});
// Returns: top 20 products, all score 65+, rating 4.0+, commission 8%+
```

### Telegram Send with Quality Check
```javascript
const response = await fetch('/api/send', {
  method: 'POST',
  body: JSON.stringify({
    chatId: process.env.TELEGRAM_CHAT_ID,
    photoUrl: product.imageUrl,
    caption: "Your caption here",
    product: {  // Optional: enables quality gate
      score: product.score,
      rating: product.rating,
      commissionRate: product.commissionRate,
      shippingDays: product.shippingDays,
      categoryId: product.categoryId
    }
  })
});

if (!response.ok) {
  const error = await response.json();
  console.log("❌ Rejected reasons:", error.reasons);
  // Product didn't meet Telegram quality standards
}
```

---

## Understanding Scores

### What's a Good Score?

| Score | Meaning | Action |
|-------|---------|--------|
| **85+** | Elite product | Post immediately, feature |
| **70-84** | High quality | Great Telegram candidate |
| **65-69** | Passes gates | Acceptable, can post |
| **50-64** | Marginal | Dashboard only, not Telegram |
| **<50** | Low quality | Filtered out automatically |

### What Goes Into the Score

**Positive Factors** (increase score):
- ✅ High sales volume (proven demand)
- ✅ High rating (4.0+/5)
- ✅ Good discount (15-60%)
- ✅ Good commission (8%+)
- ✅ Tech category match
- ✅ Fast shipping (<30 days)

**Negative Factors** (decrease score):
- ❌ Poor rating (<3.5/5)
- ❌ Low sales (<50 units)
- ❌ Generic title/keywords
- ❌ Suspicious discount (>80%)
- ❌ Very common product (saturation)
- ❌ Blocked category (food, clothing, furniture, etc.)

---

## Filtering Explained

### Dashboard Filtering (Light)
- Minimum rating: 3.5/5
- Minimum sales: 50 units
- Minimum commission: 5%
- Maximum shipping: 60 days

**Result**: Shows diverse products, good for browsing

### Telegram Filtering (Strict)
- Minimum score: 65/100 ← Key difference
- Minimum rating: 4.0/5 ← Higher
- Minimum commission: 8% ← Higher
- Maximum shipping: 45 days ← Faster

**Result**: Only elite products, high post quality

---

## Category System

### Preferred Categories (Tech-First)
**Primary (10.0 points)**:
- Electronic Gadgets
- Mobile Accessories
- Gaming Accessories
- Audio & Video
- Smart Home & Garden
- Lighting (RGB)
- Computer Peripherals

**Secondary (7-8 points)**:
- Cameras & Photo
- Action Camera / Drone
- Storage Solutions
- Car Accessories

**Tertiary (5-6 points)**:
- Office Supplies
- Wearables
- Tools

### Blocked Categories (Auto-Rejected)
❌ Food & Beverage
❌ Clothing & Apparel
❌ Furniture & Home Decor
❌ Beauty & Cosmetics
❌ Toys & Collectibles
❌ Jewelry & Watches

---

## Debugging

### Check Why a Product Was Ranked Low

```typescript
import { evaluateQuality } from "@/lib/intelligence/filterLowQuality";

const result = evaluateQuality(productSignals);
console.log(result.issues);    // Why rejected
console.log(result.warnings);  // What to watch
console.log(result.score);     // 0-100 quality score
```

### Check Telegram Gate Decision

```typescript
import { evaluateTelegramGate } from "@/lib/intelligence/telegramGate";

const gate = evaluateTelegramGate(product);
console.log(gate.approved);    // true/false
console.log(gate.reasons);     // Why approved/rejected
console.log(gate.warnings);    // Cautions
```

### View Full Ranking Pipeline

```typescript
import { rankProductsPipeline, getRankingReport } from "@/lib/intelligence/rankingPipeline";

const result = rankProductsPipeline(rawProducts);
console.log(getRankingReport(result));
// Shows: total, passed, rejected, top score, average score
```

---

## Common Scenarios

### "Why isn't this product showing?"

**Possible reasons**:
1. Rating < 3.5 ❌
2. Sales < 50 units ❌
3. Commission < 5% ❌
4. Shipping > 60 days ❌
5. Blocked category ❌

Use quality report to check:
```typescript
import { getQualityReport } from "@/lib/intelligence/filterLowQuality";
console.log(getQualityReport(signals));
```

### "Why can't I send this to Telegram?"

**Check gate result**:
```typescript
const gate = evaluateTelegramGate(product);
if (!gate.approved) {
  console.log("Reasons:", gate.reasons);
  console.log("Warnings:", gate.warnings);
}
```

**Common Telegram rejections**:
- Score < 65/100
- Rating < 4.0/5
- Commission < 8%
- Shipping > 45 days
- Blocked category

### "How can I adjust scoring?"

All thresholds are configurable:

```typescript
import { rankProductsPipeline } from "@/lib/intelligence/rankingPipeline";

const result = rankProductsPipeline(products, {
  scoreConfig: {
    minRating: 3.0,           // Lower bar
    idealDiscountMax: 50,     // Prefer smaller discounts
    minCommissionRate: 10,    // Higher commission requirement
  },
  qualityConfig: {
    minSalesVolume: 100,      // Higher sales threshold
  },
  maxResults: 100,            // Get more results
  applyQualityFilter: false,  // Skip filtering entirely
});
```

---

## Performance Notes

The intelligence layer is **lightweight**:
- ✅ No external API calls
- ✅ No ML models
- ✅ Pure function logic
- ✅ Processes 1000 products in <100ms

Ranked results are returned in the same format as raw products, so **no frontend changes needed**.

---

## Monitoring Checklist

Weekly review:
- [ ] Check average product score trending
- [ ] Review rejected products for patterns
- [ ] Validate Telegram gate is catching spam
- [ ] Spot-check category assignments
- [ ] Monitor commission rate distribution

---

## Support

### If things break:

1. **Compilation error**: Check TypeScript types in file
2. **API returns empty**: Check quality filters aren't too strict
3. **Telegram gate rejects everything**: Adjust `TELEGRAM_GATE_CONFIG` thresholds
4. **Scoring seems off**: Review weights in `scoring.ts`

See `IMPLEMENTATION_SUMMARY.md` for architecture details.

---

**Ready to improve your Telegram channel! 🚀**
