import type { ProductIntelligence } from "./product-intelligence";

export type MarketplaceSignals = {
  isChoice: boolean;
  isBundleDeal: boolean;
  isTopSelling: boolean;
  isLowestPrice90Days: boolean;
  isPremiumQuality: boolean;
  isBigBrand: boolean;
  hasInstallments: boolean;
  hasStrongSocialProof: boolean;
  isTrending: boolean;
  hasVideo: boolean;
};

const brandKeywords = [
  "anker",
  "baseus",
  "qcy",
  "xiaomi",
  "soundcore",
  "jbl",
  "razer",
  "logitech",
  "asus",
  "msi",
  "kingston",
  "seagate",
  "samsung",
  "dell",
  "lenovo",
  "corsair",
  "gamesir",
];

const bundleKeywords = ["bundle", "kit", "set", "pack", "combo", "pair", "2 in 1", "3 in 1"];

export const extractMarketplaceSignals = (
  product: Partial<ProductIntelligence>
): MarketplaceSignals => {
  const title = (product.title || "").toLowerCase();
  const sales = product.salesVolume ?? 0;
  const rating = product.rating ?? 0;
  const discount = product.discountPercent ?? 0;
  const price = product.price ?? 0;

  const isChoice = !!(product.promoCode && (title.includes("choice") || title.includes("choice product")));
  const isBundleDeal = bundleKeywords.some((k) => title.includes(k)) || (discount >= 20 && (title.includes("pack") || title.includes("pair")));
  const isTopSelling = sales >= 1000 || !!product.isHotProduct;
  const isLowestPrice90Days = discount >= 30 && price > 0 && price <= 40;
  const isPremiumQuality = rating >= 4.5 && sales >= 200;
  const isBigBrand = brandKeywords.some((b) => title.includes(b));
  const hasInstallments = false; // not present in product API reliably
  const hasStrongSocialProof = sales >= 300 && rating >= 4.2;
  const isTrending = !!product.isHotProduct || (product.score ?? 0) >= 75 || (sales >= 500 && discount >= 15);
  const hasVideo = !!product.hasVideo;

  return {
    isChoice,
    isBundleDeal,
    isTopSelling,
    isLowestPrice90Days,
    isPremiumQuality,
    isBigBrand,
    hasInstallments,
    hasStrongSocialProof,
    isTrending,
    hasVideo,
  };
};

export default extractMarketplaceSignals;
