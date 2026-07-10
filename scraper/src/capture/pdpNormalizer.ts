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

  }
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

export function normalizePdp(raw: RawPdp, sourceUrl: string): ShopeePdpData {
  ;
  const item = raw.item ?? {};
  const pb = raw.price_breakdown ?? {};
  const priceObj = pb.price ?? {};
  const beforeObj = pb.price_before_discount ?? {};

  const price = safeNum(priceObj.single_value ?? priceObj.range_min) / 100000;
  const priceMax = safeNum(priceObj.range_max) / 100000;
  const priceBefore = safeNum(beforeObj.single_value ?? beforeObj.range_min) / 100000;
  const priceBeforeMax = safeNum(beforeObj.range_max) / 100000;

  const showDiscount = safeNum(item.show_discount);
  const discountPercent = showDiscount > 0
    ? showDiscount
    : priceBefore > 0
      ? Math.round(((priceBefore - price) / priceBefore) * 100)
      : 0;

  const discounts = (pb.discount_breakdown ?? []).map((dd) => ({
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
    sourceUrl,
    capturedAt: Date.now(),
  };
}
