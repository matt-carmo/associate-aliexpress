import type { ShopeePdpData } from "../types.js";

interface RawPdp {
  item: {
    item_id?: number;
    shop_id?: number;
    title?: string;
    show_discount?: number;
    has_model_with_available_shopee_stock?: boolean;
    item_rating?: { rating_star?: number };
    product_price?: {
      installment_info?: {
        recommended_plan?: {
          months?: number;
          pay_per_month?: number;
        };
      };
    };
    currency?: string;
    image?: string;
    price?: number;
    price_min?: number;
    price_max?: number;
    price_before_discount?: number;
    price_min_before_discount?: number;
    price_max_before_discount?: number;
  }
  product_price?: {
    price?: {
      single_value?: number;
      range_min?: number;
      range_max?: number;
    };
    price_before_discount?: {
      single_value?: number;
      range_min?: number;
      range_max?: number;
    };
    discount?: number;
    installment_info?: {
      recommended_plan?: {
        months?: number;
        pay_per_month?: number;
      };
    };
  };
  price_breakdown?: {
    price?: {
      single_value?: number;
      range_min?: number;
      range_max?: number;
    };
    price_before_discount?: {
      single_value?: number;
      range_min?: number;
      range_max?: number;
    };
    discount_breakdown?: Array<{
      type?: number;
      discount_amount?: number;
      price_source?: string;
    }>;
  };

}

function safeNum(v: unknown): number {
  return typeof v === "number" && isFinite(v) ? v : 0;
}

export function normalizePdp(raw: RawPdp, sourceUrl: string): ShopeePdpData | null {
  const item = raw.item ?? {};
  const pb = raw.price_breakdown;
  const pp = raw.product_price;

  const priceObj = pb?.price ?? pp?.price;
  const beforeObj = pb?.price_before_discount ?? pp?.price_before_discount ?? {};

  if (!priceObj) {
    return null;
  }

  const validRangeMin = safeNum(priceObj.range_min) > 0 ? safeNum(priceObj.range_min) : null;
  const validRangeMax = safeNum(priceObj.range_max) > 0 ? safeNum(priceObj.range_max) : null;
  const validSingleValue = safeNum(priceObj.single_value) > 0 ? safeNum(priceObj.single_value) : null;

  const validBeforeMin = safeNum(beforeObj.range_min) > 0 ? safeNum(beforeObj.range_min) : null;
  const validBeforeMax = safeNum(beforeObj.range_max) > 0 ? safeNum(beforeObj.range_max) : null;
  const validBeforeSingle = safeNum(beforeObj.single_value) > 0 ? safeNum(beforeObj.single_value) : null;

  const itemPriceMin = safeNum(item.price_min) > 0 ? safeNum(item.price_min) : null;
  const itemPriceMax = safeNum(item.price_max) > 0 ? safeNum(item.price_max) : null;
  const itemPriceBeforeMin = safeNum(item.price_min_before_discount) > 0 ? safeNum(item.price_min_before_discount) : null;
  const itemPriceBeforeMax = safeNum(item.price_max_before_discount) > 0 ? safeNum(item.price_max_before_discount) : null;

  const price = safeNum(validRangeMin ?? validSingleValue ?? itemPriceMin) / 100000;
  const priceMax = safeNum(validRangeMax ?? itemPriceMax) / 100000;
  const priceBefore = safeNum(validBeforeMin ?? validBeforeSingle ?? itemPriceBeforeMin) / 100000;
  const priceBeforeMax = safeNum(validBeforeMax ?? itemPriceBeforeMax) / 100000;

  const showDiscount = safeNum(item.show_discount);
  const discountPercent = showDiscount > 0
    ? showDiscount
    : priceBefore > 0
      ? Math.round(((priceBefore - price) / priceBefore) * 100)
      : 0;

  const discounts = (pb?.discount_breakdown ?? []).map((dd) => ({
    type: safeNum(dd.type),
    amount: safeNum(dd.discount_amount),
    source: dd.price_source ?? "",
  }));

  const installment = item.product_price?.installment_info?.recommended_plan;
  
  return {
    itemId: safeNum(item.item_id),
    shopId: safeNum(item.shop_id),
    title: item.title ?? "",
    currency: item.currency ?? "BRL",
    price,
    ...(priceMax > price ? { priceMax } : {}),
    priceBeforeDiscount: priceBefore,
    ...(priceBeforeMax > priceBefore ? { priceBeforeDiscountMax: priceBeforeMax } : {}),
    discountPercent,
    discounts,
    hasStock: item.has_model_with_available_shopee_stock ?? false,
    ...(installment?.months ? { installmentMonths: installment.months } : {}),
    ...(installment?.pay_per_month ? { installmentMonthly: installment.pay_per_month } : {}),
    ...(item.item_rating?.rating_star ? { ratingStar: item.item_rating.rating_star } : {}),
    ...(item.image ? { imageUrl: `https://down-br.img.susercontent.com/file/${item.image}` } : {}),
    sourceUrl,
    capturedAt: Date.now(),
  };
}
