export const SHOPEE_GRAPHQL_URL = "https://open-api.affiliate.shopee.com.br/graphql";

export const getShopeeConfig = () => {
    const appId = process.env.SHOPEE_APP_ID;
    const appSecret = process.env.SHOPEE_APP_SECRET;
    if (!appId || !appSecret) {
        throw new Error("Missing Shopee credentials. Set SHOPEE_APP_ID and SHOPEE_APP_SECRET.");
    }
    return { appId, appSecret };
};
