import type { Page } from "playwright";
export declare class ShopeeSessionExpiredError extends Error {
    constructor(message?: string);
}
declare global {
    interface Error {
        code?: string;
    }
}
export declare function assertShopeeSession(page: Page): Promise<void>;
