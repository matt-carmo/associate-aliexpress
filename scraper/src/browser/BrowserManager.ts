import { chromium, type Page, type BrowserContext } from "playwright";
import fs from "node:fs";
import { config } from "../config.js";

const SHOPEE_HOME = "https://shopee.com.br";

class BrowserManager {
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    this.initPromise = this._doInit();
    return this.initPromise;
  }

  private async _doInit(headless = config.headless): Promise<void> {
    fs.mkdirSync(config.profileDir, { recursive: true });

    this.context = await chromium.launchPersistentContext(config.profileDir, {
      channel: "chrome",
      headless,
      viewport: null,
      locale: "pt-BR",
      timezoneId: "America/Sao_Paulo",
      colorScheme: "light",
      permissions: [],
      serviceWorkers: "allow",
      baseURL: SHOPEE_HOME,
      javaScriptEnabled: true,
      bypassCSP: false,
      ignoreHTTPSErrors: false,
      args: [
        "--no-first-run",
        "--no-default-browser-check",
        "--password-store=basic",
        "--lang=pt-BR",
        "--disable-features=Translate,RendererCodeIntegrity",
        "--disable-background-networking",
        "--disable-component-update",
      ],
    });

    this.page = this.context.pages()[0] ?? (await this.context.newPage());
    // await this.page.goto(SHOPEE_HOME, { waitUntil: "domcontentloaded" });
  }

  async ensureConnected(): Promise<Page> {
    if (this.context && this.page && !this.context.isClosed()) {
      try {
        await this.page.evaluate(() => true);
        return this.page;
      } catch {
        this.page = null;
      }
    }

    console.log("BrowserManager: context closed or page dead, reinitializing...");
    await this.close();
    await this._doInit();
    return this.page!;
  }

  isConnected(): boolean {
    return this.context !== null && !this.context.isClosed();
  }

  async close(): Promise<void> {
    if (this.context) {
      await this.context.close().catch(() => {});
    }
    this.context = null;
    this.page = null;
  }
}

export const browserManager = new BrowserManager();
