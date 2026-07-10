import type { ShopeePdpData } from "@/types/shopee";
import type { DiscoveryProduct } from "./discoveryProduct";

export type HydratedProduct = {
  hydrated: DiscoveryProduct;
  promotionLink: string;
};

const parseNumber = (value?: string | number): number => {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const cleaned = String(value).replace(/[^\d.]/g, "");
  return Number.parseFloat(cleaned) || 0;
};

const mapDetailsToProduct = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details: Record<string, any>,
  fallback: DiscoveryProduct,
): DiscoveryProduct => {
  const ratingRaw = parseNumber(details.evaluate_rate);
  const rating = ratingRaw > 5 ? ratingRaw / 20 : ratingRaw;
  const price =
    parseNumber(details.target_sale_price) ||
    parseNumber(details.sale_price) ||
    parseNumber(details.app_sale_price);

  return {
    ...fallback,
    productId: details.product_id ?? fallback.productId,
    title: details.product_title || fallback.title,
    imageUrl: details.product_main_image_url || fallback.imageUrl,
    detailUrl: details.product_detail_url || fallback.detailUrl,
    categoryId:
      details.second_level_category_id ||
      details.first_level_category_id ||
      fallback.categoryId,
    categoryName:
      details.second_level_category_name ||
      details.first_level_category_name ||
      fallback.categoryName,
    shopId: details.shop_id || fallback.shopId,
    price: price || fallback.price,
    originalPrice:
      parseNumber(details.target_original_price) ||
      parseNumber(details.original_price) ||
      fallback.originalPrice,
    discountPercent: parseNumber(details.discount) || fallback.discountPercent,
    rating: rating || fallback.rating,
    salesVolume: details.lastest_volume ?? fallback.salesVolume,
    commissionRate:
      parseNumber(details.commission_rate) || fallback.commissionRate,
    shippingDays: parseNumber(details.ship_to_days) || fallback.shippingDays,
    hasVideo: Boolean(details.product_video_url) || fallback.hasVideo,
    promoCode: details.promo_code_info?.promo_code || fallback.promoCode,
    isHotProduct:
      Boolean(details.hot_product_commission_rate) || fallback.isHotProduct,
  };
};

export const extractProductId = (url: string): string => {
  const patterns = [
    /\/item\/(\d+)\.html/i,
    /product\/(\d+)\.html/i,
    /\/i\/(\d+)\.html/i,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  const fallbackMatch = url.match(/(\d{8,})/);
  return fallbackMatch?.[1] || "";
};

export const isShopeeUrl = (url: string): boolean => {
  return /shopee\.\w+/.test(url) || /cf\.shopee\.\w+/.test(url);
};

export const extractShopeeItemId = (url: string): string => {
  const patterns = [/\/product\/(\d+)\/(\d+)/i, /-i\.(\d+)\.(\d+)/i];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[2]) return match[2];
  }
  return "";
};

const mapShopeeProductToDiscovery = (
  shopeeProduct: Record<string, unknown>,
  fallback: DiscoveryProduct,
): DiscoveryProduct => {
  const priceMin = parseFloat(
    String(shopeeProduct.priceMin || shopeeProduct.price || "0"),
  );
  const priceMax = parseFloat(String(shopeeProduct.priceMax || "0"));
  const price = priceMin;
  const discountRate = Number(shopeeProduct.priceDiscountRate || 0);
  const originalPrice =
    discountRate > 0 ? priceMin / (1 - discountRate / 100) : priceMin;
  const productCatIds = Array.isArray(shopeeProduct.productCatIds)
    ? shopeeProduct.productCatIds
    : [];

  return {
    ...fallback,
    productId: String(shopeeProduct.itemId ?? fallback.productId),
    title: String(shopeeProduct.productName || fallback.title),
    imageUrl: String(shopeeProduct.imageUrl || fallback.imageUrl),
    detailUrl: String(shopeeProduct.productLink || fallback.detailUrl),
    categoryId: (productCatIds[0] as number) || fallback.categoryId,
    categoryName: "",
    shopId: (shopeeProduct.shopId as number) || fallback.shopId,
    price: price || fallback.price,
    priceMax: priceMax || undefined,
    originalPrice: originalPrice || fallback.originalPrice,
    discountPercent: discountRate || fallback.discountPercent,
    rating:
      parseFloat(String(shopeeProduct.ratingStar || "0")) || fallback.rating,
    salesVolume: Number(shopeeProduct.sales || 0) || fallback.salesVolume,
    commissionRate:
      parseFloat(String(shopeeProduct.commissionRate || "0")) * 100 ||
      fallback.commissionRate,
    shippingDays: 30,
    hasVideo: false,
    promoCode: undefined,
    isHotProduct: Number(shopeeProduct.sales || 0) >= 1000,
  };
};

export async function hydrateProduct(
  rawUrl: string,
  signal?: AbortSignal,
  existingPromotionLink?: string,
): Promise<HydratedProduct | null> {
  const isShopee = isShopeeUrl(rawUrl);
  const productId = isShopee
    ? extractShopeeItemId(rawUrl)
    : extractProductId(rawUrl);
  if (!productId) return null;

  let hydrated: DiscoveryProduct | null = null;
  let promotionLink = "";

  const fallback: DiscoveryProduct = {
    productId,
    title: "Produto sem titulo",
    imageUrl: "",
    detailUrl: rawUrl,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  const combinedSignal = signal
    ? AbortSignal.any([signal, controller.signal])
    : controller.signal;

  try {
    const apiUrl = isShopee
      ? `/api/shopee?type=product-details&item_id=${encodeURIComponent(productId)}`
      : `/api/ali?type=product-details&product_id=${encodeURIComponent(productId)}&product_detail_url=${encodeURIComponent(rawUrl)}`;
    const response = await fetch(apiUrl, { signal: combinedSignal });
    if (response.ok) {
      const payload = await response.json();
      if (payload.product) {
        hydrated = isShopee
          ? mapShopeeProductToDiscovery(payload.product, fallback)
          : mapDetailsToProduct(payload.product, fallback);

        if (isShopee) {
          const periodEnd = payload.product.periodEndTime
            ? payload.product.periodEndTime * 1000
            : 0;
          if (periodEnd && periodEnd <= Date.now()) {
            hydrated = null;
          }
        }
      }
    }
  } catch {
    // Product details not available
  } finally {
    clearTimeout(timeoutId);
  }

  if (isShopee && hydrated) {
    try {
      const pdpRes = await fetch("/api/shopee/pdp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: rawUrl }),
        signal: combinedSignal,
      });
      if (pdpRes.ok) {
        const pdpPayload = await pdpRes.json();
        if (pdpPayload.ok && pdpPayload.data) {
          const pdp = pdpPayload.data;
          hydrated = {
            ...hydrated,
            price: pdp.price,
            priceMax: pdp.priceMax,
            originalPrice: pdp.priceBeforeDiscount,
            discountPercent: pdp.discountPercent,
          };
        }
      }
    } catch {
      // Scraper failed — fall back to GraphQL prices
    }
  }

  if (existingPromotionLink) {
    promotionLink = existingPromotionLink;
  } else {
    try {
      const cleanOrigin = isShopee
        ? rawUrl.split("?")[0].split("&")[0]
        : rawUrl;
      const linkApiUrl = isShopee
        ? `/api/shopee?type=short-link&origin_url=${encodeURIComponent(cleanOrigin)}`
        : `/api/ali?type=affiliate-link&product_detail_url=${encodeURIComponent(rawUrl)}`;
      const linkResponse = await fetch(linkApiUrl, { signal: combinedSignal });
      if (linkResponse.ok) {
        const linkPayload = await linkResponse.json();
        promotionLink =
          linkPayload.promotionLink || linkPayload.shortLink || "";
      }
    } catch {
      // Affiliate link not available
    }
  }

  if (!hydrated && !promotionLink) return null;

  if (!hydrated) {
    hydrated = fallback;
  }

  return { hydrated, promotionLink };
}

export async function hydrateProductWithoutScraper(
  rawUrl: string,
  signal?: AbortSignal,
  existingPromotionLink?: string,
): Promise<HydratedProduct | null> {
  const isShopee = isShopeeUrl(rawUrl);
  const productId = isShopee
    ? extractShopeeItemId(rawUrl)
    : extractProductId(rawUrl);
  if (!productId) return null;

  let hydrated: DiscoveryProduct | null = null;
  let promotionLink = "";

  const fallback: DiscoveryProduct = {
    productId,
    title: "Produto sem titulo",
    imageUrl: "",
    detailUrl: rawUrl,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  const combinedSignal = signal
    ? AbortSignal.any([signal, controller.signal])
    : controller.signal;

  try {
    const apiUrl = isShopee
      ? `/api/shopee?type=product-details&item_id=${encodeURIComponent(productId)}`
      : `/api/ali?type=product-details&product_id=${encodeURIComponent(productId)}&product_detail_url=${encodeURIComponent(rawUrl)}`;
    const response = await fetch(apiUrl, { signal: combinedSignal });
    if (response.ok) {
      const payload = await response.json();
      if (payload.product) {
        hydrated = isShopee
          ? mapShopeeProductToDiscovery(payload.product, fallback)
          : mapDetailsToProduct(payload.product, fallback);

        if (isShopee) {
          const periodEnd = payload.product.periodEndTime
            ? payload.product.periodEndTime * 1000
            : 0;
          if (periodEnd && periodEnd <= Date.now()) {
            hydrated = null;
          }
        }
      }
    }
  } catch {
    // Product details not available
  } finally {
    clearTimeout(timeoutId);
  }

  if (existingPromotionLink) {
    promotionLink = existingPromotionLink;
  } else {
    try {
      const cleanOrigin = isShopee
        ? rawUrl.split("?")[0].split("&")[0]
        : rawUrl;
      const linkApiUrl = isShopee
        ? `/api/shopee?type=short-link&origin_url=${encodeURIComponent(cleanOrigin)}`
        : `/api/ali?type=affiliate-link&product_detail_url=${encodeURIComponent(rawUrl)}`;
      const linkResponse = await fetch(linkApiUrl, { signal: combinedSignal });
      if (linkResponse.ok) {
        const linkPayload = await linkResponse.json();
        promotionLink =
          linkPayload.promotionLink || linkPayload.shortLink || "";
      }
    } catch {
      // Affiliate link not available
    }
  }

  if (!hydrated && !promotionLink) return null;

  if (!hydrated) {
    hydrated = fallback;
  }

  return { hydrated, promotionLink };
}

const mapPdpDataToProduct = (
  pdp: ShopeePdpData,
  fallback: DiscoveryProduct,
): DiscoveryProduct => {
  return {
    ...fallback,
    productId: pdp.itemId,
    title: pdp.title || fallback.title,
    imageUrl: pdp.imageUrl || fallback.imageUrl,
    detailUrl: pdp.sourceUrl || fallback.detailUrl,
    shopId: pdp.shopId,
    price: pdp.price || fallback.price,
    priceMax: pdp.priceMax || undefined,
    originalPrice: pdp.priceBeforeDiscount || fallback.originalPrice,
    discountPercent: pdp.discountPercent || fallback.discountPercent,
    rating: pdp.ratingStar || fallback.rating,
  };
};

export async function hydrateProductWithScraper(
  rawUrl: string,
  signal?: AbortSignal,
  existingPromotionLink?: string,
): Promise<HydratedProduct | null> {
  const productId = extractShopeeItemId(rawUrl);
  if (!productId) return null;

  const fallback: DiscoveryProduct = {
    productId,
    title: "Produto sem titulo",
    imageUrl: "",
    detailUrl: rawUrl,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  const combinedSignal = signal
    ? AbortSignal.any([signal, controller.signal])
    : controller.signal;

  let hydrated: DiscoveryProduct | null = null;
  const promotionLink = existingPromotionLink || "";

  try {
    const res = await fetch("/api/shopee/pdp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: rawUrl }),
      signal: combinedSignal,
    });

    if (res.ok) {
      const payload = await res.json();
      if (payload.ok && payload.data) {
        hydrated = mapPdpDataToProduct(payload.data, fallback);
      }
    }
  } catch {
    // Scraper failed
  } finally {
    clearTimeout(timeoutId);
  }

  if (!hydrated) return null;

  return { hydrated, promotionLink };
}
