/**
 * Signal extraction from AliExpress Product API responses
 * 
 * Converts raw Product interface into normalized signals for scoring
 * Uses REAL affiliate API data:
 * - lastest_volume (sales/orders)
 * - evaluate_rate (rating 0-5)
 * - discount (%)
 * - commission_rate (affiliate %)
 * - category (first/second level)
 * - shipping days
 */

interface Product {
  app_sale_price: string;
  original_price: string;
  product_detail_url: string;
  product_small_image_urls: { string: string[] };
  second_level_category_name: string;
  target_sale_price: string;
  second_level_category_id: number;
  discount: string;
  product_main_image_url: string;
  first_level_category_id: number;
  target_sale_price_currency: string;
  target_app_sale_price_currency: string;
  tax_rate: string;
  original_price_currency: string;
  shop_url: string;
  target_original_price_currency: string;
  product_id: number;
  target_original_price: string;
  product_video_url: string;
  first_level_category_name: string;
  ship_to_days: string;
  promotion_link: string;
  sku_id: string;
  evaluate_rate: string;
  sale_price: string;
  product_title: string;
  hot_product_commission_rate: string;
  promo_code_info: { promo_code: string };
  shop_id: number;
  app_sale_price_currency: string;
  sale_price_currency: string;
  lastest_volume: number;
  target_app_sale_price: string;
  commission_rate: string;
}

export type ExtractedSignals = {
  // Core metrics from API
  productId: number | string;
  title: string;
  imageUrl: string;
  detailUrl: string;
  categoryId: number | string;
  categoryName: string;
  shopId: number | string;

  // Pricing
  salePrice: number;
  originalPrice: number;
  discountPercent: number;

  // Quality metrics
  rating: number; // 0-5
  salesVolume: number; // units sold
  commissionRate: number; // %

  // Shipping
  shippingDays: number;

  // Promotional
  promoCode?: string;
  hasVideo: boolean;
  isHotProduct: boolean;

  // Derived tiers (for faster scoring)
  priceTier: "budget" | "mid" | "premium"; // based on price
  volumeTier: "low" | "medium" | "high"; // based on sales volume
};

/**
 * Parse string currency price to number
 */
const parsePrice = (price: string | number): number => {
  if (typeof price === "number") return price;
  const cleaned = String(price).replace(/[^\d.]/g, "");
  return parseFloat(cleaned) || 0;
};

/**
 * Parse percentage string to number (0-100)
 */
const parsePercent = (percent: string | number): number => {
  if (typeof percent === "number") return percent;
  const cleaned = String(percent).replace(/[^\d.]/g, "");
  return parseFloat(cleaned) || 0;
};

/**
 * Extract normalized signals from raw Product API response
 */
export const extractSignals = (product: Partial<Product>): ExtractedSignals => {
  const salePrice = parsePrice(product.target_sale_price || product.sale_price || 0);
  const originalPrice = parsePrice(
    product.target_original_price || product.original_price || salePrice
  );
  const discountPercent = parsePercent(product.discount || 0);
  const rating = parsePercent(product.evaluate_rate || 0) / 20; // Convert to 0-5 scale
  const salesVolume = product.lastest_volume || 0;
  const commissionRate = parsePercent(product.commission_rate || 0);
  const shippingDays = parseInt(product.ship_to_days || "30", 10);
  const hasVideo = !!(product.product_video_url && product.product_video_url.length > 0);
  const isHotProduct = !!(
    product.hot_product_commission_rate &&
    product.hot_product_commission_rate.length > 0
  );

  // Determine price tier (relative sizing)
  let priceTier: "budget" | "mid" | "premium" = "mid";
  if (salePrice < 20) priceTier = "budget";
  else if (salePrice > 100) priceTier = "premium";

  // Determine volume tier
  let volumeTier: "low" | "medium" | "high" = "medium";
  if (salesVolume < 100) volumeTier = "low";
  else if (salesVolume > 1000) volumeTier = "high";

  return {
    productId: product.product_id || "",
    title: product.product_title || "",
    imageUrl: product.product_main_image_url || "",
    detailUrl: product.product_detail_url || "",
    categoryId: product.second_level_category_id || product.first_level_category_id || 0,
    categoryName: product.second_level_category_name || product.first_level_category_name || "",
    shopId: product.shop_id || 0,

    salePrice,
    originalPrice,
    discountPercent,

    rating: Math.max(0, Math.min(5, rating)),
    salesVolume,
    commissionRate,

    shippingDays,

    promoCode: product.promo_code_info?.promo_code,
    hasVideo,
    isHotProduct,

    priceTier,
    volumeTier,
  };
};

/**
 * Extract signals from multiple products
 */
export const extractSignalsFromProducts = (
  products: Partial<Product>[]
): ExtractedSignals[] => {
  return products.map((product) => extractSignals(product));
};
