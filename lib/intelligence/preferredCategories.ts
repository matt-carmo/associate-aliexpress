/**
 * Tech-first category preferences for Telegram deals channel
 * 
 * Purpose: Whitelist high-engagement categories
 * - Gadgets & electronics
 * - Gaming accessories
 * - Smart home & IoT
 * - Audio gear
 * - Storage solutions
 * - Desk setup & productivity
 * - Mobile accessories
 * - RGB/lighting products
 */

export type CategoryRelevance = {
  categoryId: number | string;
  categoryName: string;
  relevanceScore: number; // 0-10, higher = more relevant
  tier: "primary" | "secondary" | "tertiary";
  tags: string[]; // for debugging/categorization
};

export const PREFERRED_CATEGORIES: CategoryRelevance[] = [
  // PRIMARY TIER - High engagement, proven Telegram winners
  {
    categoryId: 100003109,
    categoryName: "Electronic Gadgets",
    relevanceScore: 10,
    tier: "primary",
    tags: ["gadget", "electronics", "novelty"],
  },
  {
    categoryId: 100003110,
    categoryName: "Mobile Accessories",
    relevanceScore: 9.5,
    tier: "primary",
    tags: ["mobile", "phone", "accessory"],
  },
  {
    categoryId: 100009100,
    categoryName: "Gaming Accessories",
    relevanceScore: 9.5,
    tier: "primary",
    tags: ["gaming", "esports", "pc"],
  },
  {
    categoryId: 100003111,
    categoryName: "Audio & Video",
    relevanceScore: 9,
    tier: "primary",
    tags: ["audio", "speaker", "headphone"],
  },
  {
    categoryId: 100008891,
    categoryName: "Smart Home & Garden",
    relevanceScore: 9,
    tier: "primary",
    tags: ["smart", "iot", "automation"],
  },
  {
    categoryId: 100003112,
    categoryName: "Lighting & Lamps",
    relevanceScore: 8.5,
    tier: "primary",
    tags: ["rgb", "light", "ambient"],
  },
  {
    categoryId: 100003113,
    categoryName: "Computer Peripherals",
    relevanceScore: 9,
    tier: "primary",
    tags: ["pc", "desktop", "peripheral"],
  },

  // SECONDARY TIER - Good engagement, niche appeal
  {
    categoryId: 100003114,
    categoryName: "Cameras & Photo",
    relevanceScore: 7.5,
    tier: "secondary",
    tags: ["camera", "photography", "video"],
  },
  {
    categoryId: 100003115,
    categoryName: "Action Camera",
    relevanceScore: 7.5,
    tier: "secondary",
    tags: ["action", "gopro", "vlog"],
  },
  {
    categoryId: 100003116,
    categoryName: "Drone & Accessories",
    relevanceScore: 8,
    tier: "secondary",
    tags: ["drone", "fpv", "aerial"],
  },
  {
    categoryId: 100003117,
    categoryName: "Power Tools & Accessories",
    relevanceScore: 7,
    tier: "secondary",
    tags: ["tool", "power", "diy"],
  },
  {
    categoryId: 100003118,
    categoryName: "Car Accessories",
    relevanceScore: 7,
    tier: "secondary",
    tags: ["automotive", "car", "mobile"],
  },
  {
    categoryId: 100003119,
    categoryName: "Fitness & Outdoor",
    relevanceScore: 6.5,
    tier: "secondary",
    tags: ["fitness", "sports", "outdoor"],
  },
  {
    categoryId: 100003120,
    categoryName: "Storage & Organization",
    relevanceScore: 7.5,
    tier: "secondary",
    tags: ["storage", "ssd", "external"],
  },

  // TERTIARY TIER - Niche appeal, seasonal demand
  {
    categoryId: 100003121,
    categoryName: "Office & School Supplies",
    relevanceScore: 5.5,
    tier: "tertiary",
    tags: ["office", "productivity", "stationery"],
  },
  {
    categoryId: 100003122,
    categoryName: "Tools & Hardware",
    relevanceScore: 5.5,
    tier: "tertiary",
    tags: ["hardware", "tool", "construction"],
  },
  {
    categoryId: 100003123,
    categoryName: "Wearables & Health",
    relevanceScore: 6,
    tier: "tertiary",
    tags: ["wearable", "smartwatch", "health"],
  },
];

/**
 * Fast lookup: category ID → relevance score
 */
export const categoryScoreMap = new Map<number | string, number>(
  PREFERRED_CATEGORIES.map((cat) => [cat.categoryId, cat.relevanceScore])
);

/**
 * Check if category is preferred (in whitelist)
 */
export const isPreferredCategory = (
  categoryId: number | string | undefined
): boolean => {
  if (!categoryId) return false;
  return categoryScoreMap.has(categoryId);
};

/**
 * Get relevance score for category (0 if not preferred)
 */
export const getCategoryRelevanceScore = (
  categoryId: number | string | undefined
): number => {
  if (!categoryId) return 0;
  return categoryScoreMap.get(categoryId) ?? 0;
};

/**
 * Get tier of category
 */
export const getCategoryTier = (
  categoryId: number | string | undefined
): "primary" | "secondary" | "tertiary" | "none" => {
  if (!categoryId) return "none";
  const cat = PREFERRED_CATEGORIES.find((c) => c.categoryId === categoryId);
  return cat?.tier ?? "none";
};
