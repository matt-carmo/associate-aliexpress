import axios from "axios";
import { getAliExpressConfig, getDefaultParams } from "./utils/defaultParams";
import { signRequest } from "./utils/signRequest";
import { baseUrlSync } from "./utils/defaultParams";
import { rankProductsQuick, rankProductsStrict } from "./intelligence/rankingPipeline";
import type { ProductIntelligence } from "./intelligence/product-intelligence";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createSignedParams = (params: Record<string, any>) => {
    const { appSecret } = getAliExpressConfig();
    const sign = signRequest(params, appSecret);

    return { ...params, sign };
};





export const generateAffiliateLink = async ({ product_detail_url, ship_to_country, app_signature, promotion_link_type }: {
    product_detail_url: string;
    ship_to_country?: string;
    app_signature?: string;
    promotion_link_type?: string;
}) => {
    const cleanUrl = product_detail_url.split("?")[0];

    const params: Record<string, string> = {
        ...getDefaultParams(),
        method: "aliexpress.affiliate.link.generate",
        promotion_link_type: promotion_link_type ?? "0",
        source_values: cleanUrl,
        tracking_id: "default",
    }

    if (ship_to_country) params.ship_to_country = ship_to_country;
    if (app_signature) params.app_signature = app_signature;

    const response = await axios.post(baseUrlSync, createSignedParams(params));

    const respResult = response.data?.aliexpress_affiliate_link_generate_response?.resp_result;
    if (respResult?.resp_code !== 200) {
        throw new Error(respResult?.resp_msg || "Affiliate link not available for this product");
    }

    const promotionLinksObj = respResult?.result?.promotion_links;
    if (!promotionLinksObj?.promotion_link) {
        throw new Error("Affiliate link not available for this product");
    }

    const links = Array.isArray(promotionLinksObj.promotion_link)
        ? promotionLinksObj.promotion_link
        : [promotionLinksObj.promotion_link];

    const link = links[0];
    return link?.promotion_link || "";
};

export const getProducts = async ({category_ids, keywords, page_no, sort}: {category_ids: string, keywords?: string, page_no: number, sort: string}) => {
    const params = {
        ...getDefaultParams(),
        method: "aliexpress.affiliate.product.query",
        category_ids: category_ids,
        page_no: page_no,
        tracking_id: "default",
        keywords: keywords?.trim() || "",
        sort:sort,
        country: "BR",
        target_currency: "BRL",
        target_language: "PT",
        ship_to_country: "BR",
    }
    const response = await axios.post(baseUrlSync, createSignedParams(params));
    return response.data.aliexpress_affiliate_product_query_response.resp_result.result.products;
};
export const getProductsInfo = async ({product_ids}: {product_ids: string}) => {
    const params = {
        ...getDefaultParams(),
        method: "aliexpress.affiliate.productdetail.get",
        product_ids: product_ids,
        country: "BR",
        target_currency: "BRL",
        target_language: "PT",
        ship_to_country: "BR",
    }
    const response = await axios.post(baseUrlSync, createSignedParams(params));

    const respResult = response.data?.aliexpress_affiliate_productdetail_get_response?.resp_result;
    if (respResult?.resp_code !== 200) {
        console.error("AliExpress product detail error:", respResult?.resp_msg);
        return null;
    }
    return respResult?.result?.products?.product ?? null;
}
export const getFeaturedProducts = async ({category_id, sort, promotion_name, page_no}: {sort:string,page_no: number, category_id: string, promotion_name?: string}) => {
    const params = {
        ...getDefaultParams(),
        method: "aliexpress.affiliate.featuredpromo.products.get",
        category_id: category_id,
        promotion_name: promotion_name,
        tracking_id: "default",
        page_no: page_no,
        sort:sort,
        target_currency: "BRL",
        target_language: "PT",
        country: "BR",
        ship_to_country: "BR",
    }
    const response = await axios.post(baseUrlSync, createSignedParams(params));
    return response.data.aliexpress_affiliate_featuredpromo_products_get_response.resp_result.result.products;
};

export const getFeaturedPromos = async () => {
    const params = {
        ...getDefaultParams(),
        method: "aliexpress.affiliate.featuredpromo.get",     
    }
    const response = await axios.post(baseUrlSync, createSignedParams(params));
    return response.data.aliexpress_affiliate_featuredpromo_get_response.resp_result.result.promos.promo;
}
export const getHotProducts = async ({category_ids, keywords, page_no, sort}: {category_ids: string, keywords?: string , page_no: number, sort: string}) => {
    const params = {
        ...getDefaultParams(),
        method: "aliexpress.affiliate.hotproduct.query",
        promotion_link_type: "0",
        category_ids: category_ids,
        source_values: "",
        tracking_id: "default",
        country: "BR",
        page_no: page_no,
        keywords: keywords?.trim() || "",
        sort:sort,
        target_currency: "BRL",
        target_language: "PT",
        ship_to_country: "BR",
    }
    const response = await axios.post(baseUrlSync, createSignedParams(params));
    return response.data.aliexpress_affiliate_hotproduct_query_response.resp_result.result.products;
};

// ============================================================================
// RANKED VERSIONS - Apply intelligence filtering & scoring
// ============================================================================

/**
 * Get products with quality ranking (dashboard mode - no hard filtering)
 * Shows top candidates after scoring, includes some lower-quality items for discovery
 */
export const getProductsRanked = async ({
    category_ids,
    keywords,
    page_no,
    sort,
}: {
    category_ids: string;
    keywords?: string;
    page_no: number;
    sort: string;
}): Promise<ProductIntelligence[]> => {
    const productsRaw = await getProducts({ category_ids, keywords, page_no, sort });
    const productsArray = Array.isArray(productsRaw)
        ? productsRaw
        : productsRaw?.product ?? productsRaw?.products ?? [];
    return rankProductsQuick(productsArray, 50);
};

/**
 * Get hot products with quality ranking
 */
export const getHotProductsRanked = async ({
    category_ids,
    keywords,
    page_no,
    sort,
}: {
    category_ids: string;
    keywords?: string;
    page_no: number;
    sort: string;
}): Promise<ProductIntelligence[]> => {
    const productsRaw = await getHotProducts({ category_ids, keywords, page_no, sort });
    const productsArray = Array.isArray(productsRaw)
        ? productsRaw
        : productsRaw?.product ?? productsRaw?.products ?? [];
    return rankProductsQuick(productsArray, 50);
};

/**
 * Get featured products with quality ranking
 */
export const getFeaturedProductsRanked = async ({
    category_id,
    sort,
    promotion_name,
    page_no,
}: {
    sort: string;
    page_no: number;
    category_id: string;
    promotion_name?: string;
}): Promise<ProductIntelligence[]> => {
    const productsRaw = await getFeaturedProducts({
        category_id,
        sort,
        promotion_name,
        page_no,
    });
    const productsArray = Array.isArray(productsRaw)
        ? productsRaw
        : productsRaw?.product ?? productsRaw?.products ?? [];
    return rankProductsQuick(productsArray, 50);
};

/**
 * Get products with STRICT quality ranking (Telegram mode)
 * Only returns high-quality candidates that pass all gates
 */
export const getProductsStrict = async ({
    category_ids,
    keywords,
    page_no,
    sort,
}: {
    category_ids: string;
    keywords?: string;
    page_no: number;
    sort: string;
}): Promise<ProductIntelligence[]> => {
    const productsRaw = await getProducts({ category_ids, keywords, page_no, sort });
    const productsArray = Array.isArray(productsRaw)
        ? productsRaw
        : productsRaw?.product ?? productsRaw?.products ?? [];
    return rankProductsStrict(productsArray, 20);
};

/**
 * Get hot products with strict quality ranking
 */
export const getHotProductsStrict = async ({
    category_ids,
    keywords,
    page_no,
    sort,
}: {
    category_ids: string;
    keywords?: string;
    page_no: number;
    sort: string;
}): Promise<ProductIntelligence[]> => {
    const productsRaw = await getHotProducts({ category_ids, keywords, page_no, sort });
    const productsArray = Array.isArray(productsRaw)
        ? productsRaw
        : productsRaw?.product ?? productsRaw?.products ?? [];
    return rankProductsStrict(productsArray, 20);
};

/**
 * Get featured products with strict quality ranking
 */
export const getFeaturedProductsStrict = async ({
    category_id,
    sort,
    promotion_name,
    page_no,
}: {
    sort: string;
    page_no: number;
    category_id: string;
    promotion_name?: string;
}): Promise<ProductIntelligence[]> => {
    const productsRaw = await getFeaturedProducts({
        category_id,
        sort,
        promotion_name,
        page_no,
    });
    const productsArray = Array.isArray(productsRaw)
        ? productsRaw
        : productsRaw?.product ?? productsRaw?.products ?? [];
    return rankProductsStrict(productsArray, 20);
};