import { chromium, type Page, type BrowserContext } from "playwright";
import { exec } from "node:child_process";
import { profileBootstrap, cleanSingletonLocks } from "./profileBootstrap.js";
import { config } from "../config.js";

const CDP_URL = `http://localhost:${config.cdpPort}`;
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

  private async _doInit(): Promise<void> {
    profileBootstrap(config.profileDir);
    cleanSingletonLocks(config.profileDir);
    this.launchChrome();
    await this.waitForCdp();
    const browser = await chromium.connectOverCDP(CDP_URL);
    this.context = browser.contexts()[0];
    this.page = this.context.pages()[0] ?? (await this.context.newPage());
    await this.page.goto(SHOPEE_HOME, { waitUntil: "networkidle" });
  }

  private launchChrome(): void {
    exec(
      `${config.chromeExecutable} --user-data-dir=${config.profileDir} --remote-debugging-port=${config.cdpPort}`,
    );
    console.log("BrowserManager: Chrome launched");
  }

  private async waitForCdp(maxWaitMs = 15000): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      try {
        const res = await fetch(`${CDP_URL}/json/version`);
        if (res.ok) return;
      } catch {}
      await new Promise((r) => setTimeout(r, 500));
    }
    throw new Error("CDP did not become available within timeout");
  }

  async ensureConnected(): Promise<Page> {
    if (this.context && this.page) {
      try {
        await this.page.evaluate(() => true);
        return this.page;
      } catch {}
    }

    console.log("BrowserManager: reconnecting...");
    try {
      const browser = await chromium.connectOverCDP(CDP_URL);
      this.context = browser.contexts()[0];
      this.page = this.context.pages()[0] ?? (await this.context.newPage());
      return this.page;
    } catch {
      console.log("BrowserManager: reconnect failed, relaunching Chrome...");
      this.launchChrome();
      await this.waitForCdp();
      const browser = await chromium.connectOverCDP(CDP_URL);
      this.context = browser.contexts()[0];
      this.page = this.context.pages()[0] ?? (await this.context.newPage());
      return this.page;
    }
  }

  isConnected(): boolean {
    return this.context !== null;
  }

  async close(): Promise<void> {
    this.context = null;
    this.page = null;
  }
}

export const browserManager = new BrowserManager();