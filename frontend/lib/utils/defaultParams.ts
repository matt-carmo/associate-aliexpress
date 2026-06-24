export const baseUrlSync = "https://api-sg.aliexpress.com/sync/";

export const getAliExpressConfig = () => {
    const appKey = process.env.ALIEXPRESS_APP_KEY;
    const appSecret = process.env.ALIEXPRESS_APP_SECRET;

    if (!appKey || !appSecret) {
        throw new Error("Missing marketplace credentials. Set ALIEXPRESS_APP_KEY and ALIEXPRESS_APP_SECRET.");
    }

    return { appKey, appSecret };
};

export const getDefaultParams = () => ({
    app_key: getAliExpressConfig().appKey,
    sign_method: "md5",
    timestamp: new Date().toISOString().replace(/[-:.TZ]/g, ""),
    v: "2.0",
});