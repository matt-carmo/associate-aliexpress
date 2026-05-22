/**
 * Blocked categories for Telegram tech deals channel
 * 
 * Purpose: Prevent low-relevance, marketplace junk from appearing
 * - Food & beverages
 * - Clothing & apparel
 * - Home decor & furniture
 * - Beauty & cosmetics
 * - Toys & collectibles
 * - General merchandise
 */

export type BlockedCategoryReason =
  | "marketplace-junk"
  | "low-ctr"
  | "generic-apparel"
  | "food-beverage"
  | "decor"
  | "collectible"
  | "oversaturated"
  | "low-margin";

export type BlockedCategory = {
  categoryId: number | string;
  categoryName: string;
  reason: BlockedCategoryReason;
};

export const BLOCKED_CATEGORIES: BlockedCategory[] = [
  // Food & Beverage - not tech
  {
    categoryId: 2,
    categoryName: "Food",
    reason: "food-beverage",
  },
  {
    categoryId: 200183144,
    categoryName: "Canned Food",
    reason: "food-beverage",
  },

  // Clothing & Apparel - low Telegram appeal
  {
    categoryId: 100002513,
    categoryName: "Apparel",
    reason: "generic-apparel",
  },
  {
    categoryId: 100002514,
    categoryName: "Men's Clothing",
    reason: "generic-apparel",
  },
  {
    categoryId: 100002515,
    categoryName: "Women's Clothing",
    reason: "generic-apparel",
  },
  {
    categoryId: 100002516,
    categoryName: "Shoes",
    reason: "generic-apparel",
  },

  // Home Decor & Furniture - expensive, slow shipping, low margin
  {
    categoryId: 100002520,
    categoryName: "Furniture",
    reason: "decor",
  },
  {
    categoryId: 100002521,
    categoryName: "Home Decor",
    reason: "decor",
  },
  {
    categoryId: 100002522,
    categoryName: "Bedding",
    reason: "decor",
  },

  // Beauty & Personal Care - saturated, low affiliate rates
  {
    categoryId: 100002530,
    categoryName: "Beauty & Personal Care",
    reason: "oversaturated",
  },
  {
    categoryId: 100002531,
    categoryName: "Makeup",
    reason: "oversaturated",
  },
  {
    categoryId: 100002532,
    categoryName: "Skincare",
    reason: "oversaturated",
  },

  // Toys & Collectibles - fake inventory, dropship spam
  {
    categoryId: 100002540,
    categoryName: "Toys & Games",
    reason: "collectible",
  },
  {
    categoryId: 100002541,
    categoryName: "Action Figures",
    reason: "collectible",
  },
  {
    categoryId: 100002542,
    categoryName: "Model Building",
    reason: "collectible",
  },

  // Jewelry - high fraud risk, margin compression
  {
    categoryId: 100002550,
    categoryName: "Jewelry",
    reason: "low-margin",
  },

  // Watches - oversaturated category
  {
    categoryId: 100002551,
    categoryName: "Watches",
    reason: "oversaturated",
  },

  // Pet Supplies - low engagement
  {
    categoryId: 100002560,
    categoryName: "Pet Supplies",
    reason: "low-ctr",
  },

  // Sports & Outdoors (generic) - low margin
  {
    categoryId: 100002570,
    categoryName: "Sports & Outdoors",
    reason: "low-margin",
  },

  // General marketplace categories
  {
    categoryId: 200000000,
    categoryName: "General Merchandise",
    reason: "marketplace-junk",
  },
];

/**
 * Fast lookup: category ID → blocked status
 */
export const blockedCategoryMap = new Map<number | string, BlockedCategoryReason>(
  BLOCKED_CATEGORIES.map((cat) => [cat.categoryId, cat.reason])
);

/**
 * Check if category is blocked
 */
export const isBlockedCategory = (
  categoryId: number | string | undefined
): boolean => {
  if (!categoryId) return false;
  return blockedCategoryMap.has(categoryId);
};

/**
 * Get reason category is blocked
 */
export const getBlockedReason = (
  categoryId: number | string | undefined
): BlockedCategoryReason | null => {
  if (!categoryId) return null;
  return blockedCategoryMap.get(categoryId) ?? null;
};
