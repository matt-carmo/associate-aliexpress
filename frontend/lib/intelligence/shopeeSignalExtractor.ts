import type { ExtractedSignals } from "./signalExtractor";
import type { ShopeeProductOffer } from "@/types/shopee";

const parsePrice = (price: string): number => {
    const cleaned = price.replace(/[^\d.]/g, "");
    return parseFloat(cleaned) || 0;
};

const parseCommissionRate = (rate: string): number => {
    return parseFloat(rate) * 100 || 0;
};

export const extractShopeeSignals = (product: Partial<ShopeeProductOffer>): ExtractedSignals => {
    const salePrice = parsePrice(product.price || "0");
    const discountPercent = product.priceDiscountRate || 0;
    const originalPrice = discountPercent > 0
        ? salePrice / (1 - discountPercent / 100)
        : salePrice;
    const commissionRate = parseCommissionRate(product.commissionRate || "0");
    const salesVolume = product.sales || 0;
    const rating = parseFloat(product.ratingStar || "0");
    const shippingDays = 30;

    let priceTier: "budget" | "mid" | "premium" = "mid";
    if (salePrice < 20) priceTier = "budget";
    else if (salePrice > 100) priceTier = "premium";

    let volumeTier: "low" | "medium" | "high" = "medium";
    if (salesVolume < 100) volumeTier = "low";
    else if (salesVolume > 1000) volumeTier = "high";

    return {
        productId: product.itemId || 0,
        title: product.productName || "",
        imageUrl: product.imageUrl || "",
        detailUrl: product.productLink || "",
        categoryId: product.productCatIds?.[0] || 0,
        categoryName: "",
        shopId: product.shopId || 0,
        salePrice,
        originalPrice,
        discountPercent,
        rating: Math.max(0, Math.min(5, rating)),
        salesVolume,
        commissionRate,
        shippingDays,
        promoCode: undefined,
        hasVideo: false,
        isHotProduct: (product.sales || 0) >= 1000,
        priceTier,
        volumeTier,
    };
};

export const extractShopeeSignalsBatch = (
    products: Partial<ShopeeProductOffer>[]
): ExtractedSignals[] => products.map(extractShopeeSignals);
