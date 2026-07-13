import type { Page } from "playwright";
import type { CapturedPdp } from "../types.js";
export declare function capturePdp(page: Page, url: string, timeoutMs: number): Promise<CapturedPdp>;
