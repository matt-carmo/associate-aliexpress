# Deployment Checklist

## Pre-Deployment Verification

### Code Quality ✅
- [x] All new TypeScript files compile without errors
- [x] All modified files compile without errors
- [x] No breaking changes to existing APIs
- [x] Backward compatible with original methods
- [x] Type definitions are complete and accurate

### Files Created ✅
- [x] `lib/intelligence/preferredCategories.ts` (170 lines)
- [x] `lib/intelligence/blockedCategories.ts` (120 lines)
- [x] `lib/intelligence/signalExtractor.ts` (150 lines)
- [x] `lib/intelligence/scoring.ts` (380 lines)
- [x] `lib/intelligence/filterLowQuality.ts` (280 lines)
- [x] `lib/intelligence/rankingPipeline.ts` (220 lines)
- [x] `lib/intelligence/telegramGate.ts` (270 lines)

### Files Modified ✅
- [x] `lib/intelligence/product-intelligence.ts` (added 5 signals)
- [x] `lib/services.ts` (added 6 ranking methods)
- [x] `app/api/aliexpress/route.ts` (added ranked parameter)
- [x] `app/api/send/route.ts` (added quality gate)
- [x] `components/product.tsx` (added quality badges)

### Documentation Created ✅
- [x] `IMPLEMENTATION_SUMMARY.md` (comprehensive overview)
- [x] `QUICK_START_INTELLIGENCE.md` (usage guide)
- [x] `API_REFERENCE.md` (complete API docs)
- [x] `ARCHITECTURE_DIAGRAMS.md` (visual diagrams)
- [x] `IMPLEMENTATION_COMPLETE.md` (summary)

---

## Testing Checklist

### Unit Testing
- [ ] Test `extractSignals()` with sample products
- [ ] Test `scoreProduct()` with various ratings/volumes
- [ ] Test `evaluateQuality()` with edge cases
- [ ] Test `evaluateTelegramGate()` with boundary conditions
- [ ] Test category lookups (preferred/blocked)

### Integration Testing
- [ ] Test full pipeline with real API response
- [ ] Test ranking methods (`getProductsRanked`, etc.)
- [ ] Test API routes with ranked parameter
- [ ] Test Telegram send with quality gate
- [ ] Verify dashboard displays quality badges

### API Testing
- [ ] `GET /api/aliexpress?type=products` (raw)
- [ ] `GET /api/aliexpress?type=products&ranked=true` (ranked)
- [ ] `GET /api/aliexpress?type=hot-products&ranked=true`
- [ ] `GET /api/aliexpress?type=featured-products&ranked=true`
- [ ] `POST /api/send` with product quality check

### UI Testing
- [ ] Quality badges render correctly
- [ ] Tooltips display on hover
- [ ] Signal row shows rating/volume/commission
- [ ] Promo badges display when applicable
- [ ] No layout shifts or visual issues

---

## Deployment Steps

### 1. Pre-Deploy Verification
```bash
# Run type checking
npm run lint

# Verify builds without errors
npm run build
```

### 2. Deploy Code
```bash
# Commit changes
git add .
git commit -m "feat: Add product intelligence & ranking system"

# Push to main
git push origin main

# Deploy (your deployment method)
# e.g., vercel deploy, docker build, etc.
```

### 3. Post-Deploy Verification
- [ ] App loads without console errors
- [ ] Dashboard displays products with quality badges
- [ ] Quality scores visible in UI
- [ ] Ranking parameter works (`?ranked=true`)
- [ ] Telegram send endpoint operational
- [ ] Logs show no new errors

---

## Configuration & Tuning

### Adjust Dashboard Defaults (Optional)
**File**: `lib/intelligence/scoring.ts`
```typescript
export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  minRating: 3.5,              // Adjust if too strict/lenient
  minSalesVolume: 50,          // Lower = more products shown
  minCommissionRate: 5,        // Higher = better earnings
  maxShippingDays: 60,         // Lower = faster shipping
  idealDiscountMin: 10,        // Adjust discount sweet spot
  idealDiscountMax: 60,        // Adjust discount sweet spot
  // ... other weights
};
```

### Adjust Telegram Strict Defaults (Optional)
**File**: `lib/intelligence/telegramGate.ts`
```typescript
export const TELEGRAM_GATE_CONFIG: TelegramGateConfig = {
  minScore: 65,               // Adjust quality bar
  minRating: 4.0,            // Higher = stricter
  minCommissionRate: 8,       // Adjust earnings requirement
  maxShippingDays: 45,        // Adjust shipping speed requirement
  requireVideo: false,        // Enforce videos?
};
```

### Preferred Categories (Optional)
**File**: `lib/intelligence/preferredCategories.ts`
```typescript
export const PREFERRED_CATEGORIES: CategoryRelevance[] = [
  // Add your own high-engagement categories
  // Adjust relevance scores (0-10)
];
```

### Blocked Categories (Optional)
**File**: `lib/intelligence/blockedCategories.ts`
```typescript
export const BLOCKED_CATEGORIES: BlockedCategory[] = [
  // Add categories to block
  // Update as needed
];
```

---

## Monitoring After Deployment

### Daily Checks
- [ ] Check dashboard loading and displaying rankings
- [ ] Verify quality badges appear correctly
- [ ] Monitor API response times (should be <200ms)
- [ ] Check for any console errors in UI
- [ ] Verify Telegram send works end-to-end

### Weekly Analysis
- [ ] Check average product score trending
- [ ] Review products being rejected/filtered
- [ ] Verify Telegram gate is working as intended
- [ ] Monitor commission rate distribution
- [ ] Review category scoring accuracy

### Metrics to Track
```
- Average product score
- Pass rate (% products passing quality filter)
- Rejection reasons (top 5)
- Time to rank 100 products
- Telegram gate approval rate
- Commission rate of top products
- Rating distribution
```

---

## Rollback Plan

If issues occur after deployment:

### Quick Rollback
```bash
# Revert to previous version
git revert HEAD
git push origin main
npm run deploy
```

### Feature Disable
If system has bugs, disable ranking temporarily:
```typescript
// In API route
const ranked = false; // Force ranked=false
```

### Config Adjustment
If thresholds are wrong:
1. Edit config in `scoring.ts` or `telegramGate.ts`
2. Redeploy (changes apply immediately)
3. Monitor impact

---

## Performance Benchmarks

Expected performance (for monitoring):

| Operation | Expected Time |
|-----------|--------------|
| Extract signals from 100 products | <10ms |
| Filter low quality | <20ms |
| Score 100 products | <30ms |
| Rank 100 products | <10ms |
| Full pipeline (100 products) | <100ms |
| API response (with ranking) | <200ms |

If times exceed these, check:
- Database query performance
- API response from AliExpress
- Server resource usage

---

## Success Criteria

✅ System is working well if:

1. **Dashboard**:
   - Products display with quality scores
   - Quality badges visible and accurate
   - Tooltips work on hover
   - No visual issues

2. **Telegram**:
   - Only high-quality products sent
   - Gate rejects low-quality candidates
   - Error messages clear and helpful

3. **API**:
   - Ranked queries return sorted results
   - Raw queries still work (backward compatible)
   - Response times acceptable (<200ms)

4. **Scoring**:
   - High-sales products score high
   - Good-rating products score high
   - Generic/saturated products score lower
   - Blocked categories excluded

5. **Performance**:
   - <100ms to process 100 products
   - No memory leaks
   - No repeated queries

---

## Support & Debugging

### If Dashboard Products Don't Show Scores
```typescript
// Check if products have new fields
console.log(product);
// Should have: score, rating, salesVolume, commissionRate

// Products might not have been ranked
// Check if using ranked=true parameter
```

### If Telegram Gate Rejects Everything
```typescript
// Check gate config
console.log(TELEGRAM_GATE_CONFIG);
// Might be too strict - adjust thresholds
```

### If API Returns Empty Results
```bash
# Check if quality filter too strict
# Temporarily set minRating: 3.0, minVolume: 20

# Verify API credentials still valid
echo $ALIEXPRESS_APP_KEY
echo $ALIEXPRESS_APP_SECRET
```

### If Scores Seem Wrong
```typescript
// Debug individual product
import { scoreProduct, extractSignals } from "@/lib/intelligence";

const signals = extractSignals(product);
const scored = scoreProduct(signals);
console.log('Signals:', signals);
console.log('Score:', scored.score);
console.log('Reasons:', scored.reasons);
```

---

## Documentation Links

Once deployed, team members should read in order:

1. **Getting Started**: `QUICK_START_INTELLIGENCE.md`
2. **Architecture**: `IMPLEMENTATION_SUMMARY.md`
3. **API Details**: `API_REFERENCE.md`
4. **Visual Diagrams**: `ARCHITECTURE_DIAGRAMS.md`

---

## Sign-Off Checklist

- [ ] Code review completed
- [ ] Tests passed
- [ ] Documentation reviewed
- [ ] Configuration verified
- [ ] Deployment plan confirmed
- [ ] Rollback plan ready
- [ ] Monitoring setup confirmed
- [ ] Team notified
- [ ] Deployment approved

---

## Deployment Date

**Planned**: _______________
**Completed**: _______________
**Reviewed By**: _______________
**Notes**: _______________

---

**Ready to deploy! 🚀**
