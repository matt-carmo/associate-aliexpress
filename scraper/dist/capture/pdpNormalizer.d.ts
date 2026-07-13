import type { ShopeePdpData } from "../types.js";
interface RawPdp {
    item: {
        item_id?: number;
        shop_id?: number;
        title?: string;
        show_discount?: number;
        has_model_with_available_shopee_stock?: boolean;
        item_rating?: {
            rating_star?: number;
        };
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
    };
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
export declare function normalizePdp(raw: RawPdp, sourceUrl: string): ShopeePdpData | null;
export {};
