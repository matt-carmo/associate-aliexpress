import axios from "axios";
import { getAliExpressConfig, getDefaultParams } from "./utils/defaultParams";
import { signRequest } from "./utils/signRequest";
import { baseUrlSync } from "./utils/defaultParams";

const createSignedParams = (params: Record<string, any>) => {
    const { appSecret } = getAliExpressConfig();
    const sign = signRequest(params, appSecret);

    return { ...params, sign };
};

export const generateAffiliateLink = async ({ product_detail_url }: { product_detail_url: string }) => {
    const params = {
        ...getDefaultParams(),
        method: "aliexpress.affiliate.link.generate",
        promotion_link_type: "0",
        source_values: product_detail_url,
        tracking_id: "default"
    }
    const response = await axios.post(baseUrlSync, createSignedParams(params));
    return response.data.aliexpress_affiliate_link_generate_response.resp_result.result.promotion_links.promotion_link[0].promotion_link    ;
};
