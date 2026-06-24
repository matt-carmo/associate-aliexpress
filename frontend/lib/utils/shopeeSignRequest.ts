import crypto from "crypto";
import { getShopeeConfig } from "./shopeeConfig";

export const createShopeeAuthHeaders = (payload: string): Record<string, string> => {
    const { appId, appSecret } = getShopeeConfig();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const factor = appId + timestamp + payload + appSecret;
    const signature = crypto.createHash("sha256").update(factor, "utf8").digest("hex");
    return {
        "Content-Type": "application/json",
        "Authorization": `SHA256 Credential=${appId}, Timestamp=${timestamp}, Signature=${signature}`,
    };
};
