import { type Page } from "playwright";
declare class BrowserManager {
    private context;
    private page;
    private initPromise;
    init(): Promise<void>;
    private _doInit;
    ensureConnected(): Promise<Page>;
    isConnected(): boolean;
    close(): Promise<void>;
}
export declare const browserManager: BrowserManager;
export {};
