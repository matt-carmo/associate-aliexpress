import type { ProductIntelligence } from "./product-intelligence";
import { SHOPEE_DISCOVERY_SOURCES } from "./shopeeDiscovery";

export type DiscoveryMode = "discover" | "viral-tech" | "telegram-candidates";

export type DiscoverySource = {
  id: string;
  label: string;
  poolName: string;
  description: string;
  type: "products" | "hot-products" | "featured-products";
  query: Record<string, string>;
  weight: number;
  focusTags: string[];
  accent: string;
};

export type DiscoveryModeConfig = {
  title: string;
  subtitle: string;
  eyebrow: string;
  strictTelegramGate: boolean;
  candidateFloor: number;
  sourceIds: string[];
};

export const DISCOVERY_SOURCES: DiscoverySource[] = [
  {
    id: "ds-consumer-electronics-bestsellers",
    label: "DS_ConsumerElectronics_bestsellers",
    poolName: "DS_ConsumerElectronics_bestsellers",
    description: "High-volume consumer electronics with broad Telegram appeal",
    type: "hot-products",
    query: {
      keywords: "consumer electronics rgb gaming earbuds smart device gadgets",
      sort: "LAST_VOLUME_DESC",
    },
    weight: 100,
    focusTags: ["gadget", "rgb", "gaming", "smart"],
    accent: "from-fuchsia-500 to-violet-500",
  },
  {
    id: "ds-electronic-components-bestsellers",
    label: "DS_ElectronicComponents_bestsellers",
    poolName: "DS_ElectronicComponents_bestsellers",
    description: "Components, storage, memory and builder-friendly tech",
    type: "products",
    query: {
      keywords: "ssd ram electronic components pc parts",
      sort: "SALE_PRICE_ASC",
    },
    weight: 96,
    focusTags: ["ssd", "ram", "pc", "components", "storage"],
    accent: "from-cyan-500 to-sky-500",
  },
  {
    id: "global-brand-product",
    label: "global_brand_product",
    poolName: "global_brand_product",
    description: "Brand-led products that feel more trustworthy and premium",
    type: "featured-products",
    query: {
      promotion_name: "global brand",
      sort: "SALE_PRICE_DESC",
    },
    weight: 92,
    focusTags: ["brand", "premium", "trust", "quality"],
    accent: "from-emerald-500 to-teal-500",
  },
  {
    id: "fixed-cpai-tech-categories",
    label: "Fixed CPAi (tech Categories)",
    poolName: "Fixed CPAi",
    description: "Preselected tech categories tuned for affiliate CPA performance",
    type: "products",
    query: {
      category_ids: "100003109,100003110,100009100,100003111,100008891,100003113,100003120",
      sort: "LAST_VOLUME_DESC",
    },
    weight: 95,
    focusTags: ["tech", "gaming", "audio", "smart", "desk"],
    accent: "from-orange-500 to-rose-500",
  },
  {
    id: "most-searched-products-uk",
    label: "MostSearchedProductsForUK",
    poolName: "MostSearchedProductsForUK",
    description: "Search-intent products with proven pull in English-speaking feeds",
    type: "products",
    query: {
      keywords: "wireless earbuds handheld console gaming accessories rgb desk setup",
      sort: "LAST_VOLUME_DESC",
    },
    weight: 90,
    focusTags: ["search", "trend", "gaming", "audio"],
    accent: "from-yellow-500 to-amber-500",
  },
  {
    id: "computer-office-za",
    label: "computer&office_ZA topsellers_20240423",
    poolName: "computer&office_ZA topsellers_20240423",
    description: "Desk setup, peripherals and workspace upgrades",
    type: "products",
    query: {
      keywords: "computer office desk setup keyboard mouse monitor arm webcam",
      sort: "LAST_VOLUME_DESC",
    },
    weight: 87,
    focusTags: ["desk", "setup", "peripherals", "productivity"],
    accent: "from-indigo-500 to-blue-500",
  },
  {
    id: "consumer-electronics-za",
    label: "consumer electronics_ZA topsellers_20240423",
    poolName: "consumer electronics_ZA topsellers_20240423",
    description: "Broad consumer electronics with impulse-buy potential",
    type: "hot-products",
    query: {
      keywords: "consumer electronics earbuds smart devices gadgets",
      sort: "LAST_VOLUME_DESC",
    },
    weight: 88,
    focusTags: ["audio", "smart", "gadget", "impulse"],
    accent: "from-lime-500 to-emerald-500",
  },
];

export const ALL_DISCOVERY_SOURCES: DiscoverySource[] = [
  ...DISCOVERY_SOURCES,
  ...SHOPEE_DISCOVERY_SOURCES,
];

export const DISCOVERY_MODE_CONFIG: Record<DiscoveryMode, DiscoveryModeConfig> = {
  discover: {
    title: "Discover",
    subtitle: "Marketplace-style discovery for high-CTR tech products with broad reach.",
    eyebrow: "Marketplace-style discovery feed",
    strictTelegramGate: false,
    candidateFloor: 44,
    sourceIds: DISCOVERY_SOURCES.map((source) => source.id),
  },
  "viral-tech": {
    title: "Viral Tech",
    subtitle: "Visual-first products, bundles, gadgets and impulse buys tuned for Telegram engagement.",
    eyebrow: "TikTok Shop energy for affiliate tech",
    strictTelegramGate: false,
    candidateFloor: 58,
    sourceIds: DISCOVERY_SOURCES.map((source) => source.id),
  },
  "telegram-candidates": {
    title: "Telegram Candidates",
    subtitle: "Only the products most likely to convert on Telegram channels.",
    eyebrow: "Publish-ready candidate queue",
    strictTelegramGate: true,
    candidateFloor: 62,
    sourceIds: DISCOVERY_SOURCES.map((source) => source.id),
  },
};

export const getDiscoverySourcesForMode = (mode: DiscoveryMode): DiscoverySource[] => {
  const config = DISCOVERY_MODE_CONFIG[mode];
  const sourceMap = new Map(DISCOVERY_SOURCES.map((source) => [source.id, source]));

  return config.sourceIds
    .map((sourceId) => sourceMap.get(sourceId))
    .filter((source): source is DiscoverySource => Boolean(source))
    .sort((left, right) => right.weight - left.weight);
};

export const buildDiscoveryUrl = (
  source: DiscoverySource,
  pageNo: number,
  strictTelegramGate: boolean
): string => {
  const params = new URLSearchParams({
    type: source.type,
    page_no: String(pageNo),
    ranked: "true",
    ...source.query,
  });

  if (strictTelegramGate) {
    params.set("strict", "true");
  }

  const basePath = source.id.startsWith("shopee-") ? "/api/shopee" : "/api/ali";
  return `${basePath}?${params.toString()}`;
};

export type DiscoveryProduct = Partial<ProductIntelligence> & {
  discoverySourceId?: string;
  discoverySourceLabel?: string;
  discoveryPoolName?: string;
  discoverySourceWeight?: number;
  discoveryFocusTags?: string[];
  candidateScore?: number;
  candidateReasons?: string[];
  candidateBreakdown?: Record<string, number>;
  marketplaceBadges?: Array<{ label: string; tone: string; detail?: string }>;
  qualityWarnings?: string[];
};
