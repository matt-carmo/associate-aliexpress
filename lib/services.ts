import axios from "axios";
import crypto from 'crypto';
import { signRequest } from "./utils/signRequest";
import { baseUrlSync, defaultParams } from "./utils/defaultParams";




export const generateAffiliateLink = async ({ product_detail_url }: { product_detail_url: string }) => {
    const params = {        
        ...defaultParams,
        method: "aliexpress.affiliate.link.generate",
        promotion_link_type: "0",
        source_values: product_detail_url,
        tracking_id: "default"
    }


    const sign = signRequest(params);
    const response = await axios.post(baseUrlSync, { ...params, sign });

    return response.data.aliexpress_affiliate_link_generate_response.resp_result.result.promotion_links.promotion_link[0].promotion_link    ;
};

export const getProducts = async ({category_ids, keywords, page_no, sort}: {category_ids: string, keywords?: string, page_no: number, sort: string}) => {
    const params = {
        ...defaultParams,
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
    const sign = signRequest(params);
    const response = await axios.post(baseUrlSync, { ...params, sign });
    console.log(response)
    return response.data.aliexpress_affiliate_product_query_response.resp_result.result.products;
};
export const getProductsInfo = async ({product_ids}: {product_ids: string}) => {
    const params = {
        ...defaultParams,
        method: "aliexpress.affiliate.productdetail.get",
        product_ids: product_ids,
        country: "BR",
        target_currency: "BRL",
        target_language: "PT",
        ship_to_country: "BR",
    }
    const sign = signRequest(params);
    const response = await axios.post(baseUrlSync, { ...params, sign });

    return response.data.aliexpress_affiliate_productdetail_get_response.resp_result.result.products.product;
}
export const getFeaturedProducts = async ({category_id, keywords, sort, promotion_name, page_no}: {sort:string,page_no: number, category_id: string, keywords?: string, promotion_name?: string}) => {
    const params = {
        ...defaultParams,
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
    const sign = signRequest(params);
    const response = await axios.post(baseUrlSync, { ...params, sign });
    console.log(response)
    return response.data.aliexpress_affiliate_featuredpromo_products_get_response.resp_result.result.products;
};

export const getFeaturedPromos = async () => {
    const params = {
        ...defaultParams,
        
        method: "aliexpress.affiliate.featuredpromo.get",     
    }
    const sign = signRequest(params);
    const response = await axios.post(baseUrlSync, { ...params, sign });
        return response.data.aliexpress_affiliate_featuredpromo_get_response.resp_result.result.promos.promo;
}
export const getHotProducts = async ({category_ids, keywords, page_no, sort}: {category_ids: string, keywords?: string , page_no: number, sort: string}) => {
    const params = {
        ...defaultParams,
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
    const sign = signRequest(params);
    const response = await axios.post(baseUrlSync, { ...params, sign });
    return response.data.aliexpress_affiliate_hotproduct_query_response.resp_result.result.products;
};