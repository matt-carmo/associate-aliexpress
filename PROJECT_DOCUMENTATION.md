# Associate AliExpress — Project Documentation

## 1) Overview

This project is a **Next.js App Router dashboard** for affiliate operations with AliExpress.

Main goals:
- Search and filter products from AliExpress affiliate endpoints.
- Browse **Products**, **Hot Products**, and **Featured Promo** catalogs.
- Generate affiliate links.
- Build a message and send product image + caption to Telegram channel/chat.

---

## 2) Tech Stack

- **Framework**: Next.js `15` (App Router)
- **UI**: React `19`, Tailwind CSS, shadcn/ui, Radix UI
- **Language**: TypeScript
- **HTTP Client**: Axios
- **Crypto**: Node `crypto` + md5 signing for AliExpress API
- **Icons**: Lucide

Key dependencies are defined in `package.json`.

---

## 3) Project Structure (Role Map)

- `app/`
  - `layout.tsx`: root layout, global sidebar provider, app shell.
  - `page.tsx`: root page (currently placeholder).
  - `(pages)/layout.tsx`: wraps grouped pages with `FilterProvider`.
  - `(pages)/aliexpress/products/page.tsx`: products listing page.
  - `(pages)/aliexpress/hot-products/page.tsx`: hot products listing page.
  - `(pages)/aliexpress/featured-promo/page.tsx`: featured promo listing page.
  - `config/bot.ts`: Telegram bot config.
  - `services/sendPhoto.ts`: sends photo + caption to Telegram Bot API.
  - `interfaces/product.ts`: `Product` shape used through UI.
  - `services/affiliateService.ts`: currently empty.
- `app/api/send/route.ts`
   - Server-side Telegram send endpoint used by the dialog UI.
- `api/send.ts`
  - API handler intended to proxy Telegram send action.
- `components/`
  - `app-sidebar.tsx`: sidebar navigation.
  - `filters.tsx`: reusable filter controls.
  - `product.tsx`: product card rendering.
  - `dialogProduct.tsx`: dialog flow for affiliate link generation + Telegram send.
  - `paginationProducts.tsx`: query-string pagination UI.
  - `loadings.tsx`: skeleton loading components.
  - `ui/*`: shadcn primitives.
- `hooks/`
  - `filters.tsx`: filter context and state.
  - `useSessionStorage.tsx`: helper hook.
- `lib/`
  - `services.ts`: AliExpress API methods.
  - `utils.ts`: utility (`cn`).
  - `utils/defaultParams.ts`: default API params, app key/secret, base URL.
  - `utils/signRequest.ts`: md5 sign generation.
  - `utils/categories.ts`: large static categories list.
   - `intelligence/product-intelligence.ts`: CTR-first ranking scaffold and signal model.

---

## 4) Routes

- `/` → placeholder home screen.
- `/aliexpress/products` → AliExpress `affiliate.product.query`.
- `/aliexpress/hot-products` → AliExpress `affiliate.hotproduct.query`.
- `/aliexpress/featured-promo` → AliExpress featured promo products + promo list.

Navigation is rendered by `components/app-sidebar.tsx`.

---

## 5) Core Data Flow

### 5.1 Filters and URL state
1. User interacts with controls from `components/filters.tsx`.
2. Filter values come from `hooks/filters.tsx` (`FilterProvider` + context).
3. Clicking **Filtrar** updates query parameters:
   - `search`
   - `category`
   - `promo`
   - `sort`
   - `page`
4. Pages re-fetch when `useSearchParams()` changes.

### 5.2 AliExpress requests
1. Each page calls an API function from `lib/services.ts`.
2. Function composes params from `defaultParams` + endpoint fields.
3. Params are signed with `signRequest()` from `lib/utils/signRequest.ts`.
4. Signed payload is sent to `https://api-sg.aliexpress.com/sync/`.
5. Response is normalized and rendered as product cards.

### 5.3 Send to Telegram
1. User clicks a product card (`DialogProduct`).
2. `generateAffiliateLink()` is called for that product URL.
3. A caption template is prefilled in a textarea.
4. Clicking send calls the App Router endpoint at `app/api/send/route.ts`.
5. The server route calls `sendPhoto()` (`app/services/sendPhoto.ts`).
6. Bot sends `photo + caption` to target `chat_id` without exposing the token to the client bundle.

---

## 6) AliExpress Service Layer

File: `lib/services.ts`

Available functions:
- `generateAffiliateLink({ product_detail_url })`
- `getProducts({ category_ids, keywords, page_no, sort })`
- `getProductsInfo({ product_ids })`
- `getFeaturedProducts({ category_id, keywords, sort, promotion_name, page_no })`
- `getFeaturedPromos()`
- `getHotProducts({ category_ids, keywords, page_no, sort })`

Common behavior:
- Merge endpoint-specific params with `defaultParams`.
- Sign request with md5 (`signRequest`).
- `axios.post(baseUrlSync, { ...params, sign })`.

---

## 7) UI Components and Responsibilities

- `DialogProduct`
  - Orchestrates product publish flow.
  - Generates affiliate link dynamically.
  - Builds Telegram caption.
  - Sends message through bot.
- `Product`
  - Displays image, title, commission, and prices.
- `FiltersGroup`, `Search`, `SelectCategory`, `SelectPromos`, `SelectSortFeatured`
  - Composable filter controls.
- `PaginationProducts`
  - URL-based pagination links.

---

## 8) Configuration

### 8.1 Next.js image domains
In `next.config.mjs`, external image domain is configured:
- `ae-pic-a1.aliexpress-media.com`

### 8.2 TypeScript aliases
In `tsconfig.json`:
- `@/*` points to project root.

---

## 9) Development Commands

From project root:
- `npm run dev` → run local dev server.
- `npm run build` → production build.
- `npm run start` → serve built app.
- `npm run lint` → lint checks.

---

## 10) Current Risks / Technical Notes

1. **Secrets must stay server-side**
   - AliExpress and Telegram credentials now come from environment variables.
   - Recommendation: keep them in `.env.local`, rotate any previously exposed tokens, and never reintroduce public env vars for secrets.

2. **Intelligence layer is still early**
   - `lib/intelligence/product-intelligence.ts` is the first scoring scaffold and is not yet wired into `lib/services.ts`.
   - Next step is to normalize raw AliExpress payloads into this schema and score/filter before display or publishing.

3. **`app/services/affiliateService.ts` is empty**
   - Can be removed or implemented to avoid confusion.

4. **Type definition placement/export**
   - `app/interfaces/product.ts` defines `interface Product` without explicit export; project appears to rely on global type behavior.
   - Recommendation: explicit `export interface Product` and explicit imports for safety.

5. **Home page is placeholder**
   - `app/page.tsx` currently returns placeholder content.

6. **Minor unused imports / dead code comments**
   - Multiple files contain unused imports and commented blocks.

---

## 11) Suggested Next Improvements

1. **Security first**
   - Move all credentials to environment variables.
   - Rotate exposed tokens/secrets.

2. **API layer cleanup**
   - Standardize route handlers for Next.js App Router (`app/api/.../route.ts`) if backend proxy is required.

3. **Typing cleanup**
   - Export and centralize domain types.
   - Add strict response typing for AliExpress methods.

4. **UX quality**
   - Improve loading/error states with reusable status components.
   - Add pagination bounds and disable prev/next properly.

5. **Maintainability**
   - Remove unused imports and stale experimental files.
   - Create dedicated docs folder for architecture and operations.

---

## 14) Implementation Kickoff

The first implementation phase now exists and focuses on the backend foundation:

- AliExpress credentials are loaded from env vars in `lib/utils/defaultParams.ts`.
- Request signatures are generated per call in `lib/utils/signRequest.ts`.
- Telegram sending is isolated behind `app/api/send/route.ts` so the client never touches the bot token.
- `lib/intelligence/product-intelligence.ts` adds the first CTR-first scoring contract with signals for:
   - visual hook
   - thumb-stopping potential
   - impulse-buy appeal
   - one-glance comprehension
   - curiosity
   - emotional trigger strength
   - discount attractiveness
   - saturation risk
   - genericness
   - long-explanation risk

Next implementation step:
- Map AliExpress product payloads into the intelligence schema.
- Rank candidates before they reach the dashboard or Telegram publish flow.
- Add novelty, dedupe, and historical price validation.

---

## 12) Quick Start for New Maintainers

1. Install dependencies:
   - `npm install`
2. Configure environment variables (recommended before running).
3. Start dev server:
   - `npm run dev`
4. Open app and test:
   - Product queries
   - Promo filters
   - Telegram send flow

---

## 13) Glossary

- **Affiliate link**: tracked URL generated by AliExpress affiliate API.
- **Featured promo**: campaign-based product selection returned by AliExpress promo endpoints.
- **FilterProvider**: React context managing filter state mirrored in URL query.
- **signRequest**: md5 signature required by AliExpress Open Platform request format.
