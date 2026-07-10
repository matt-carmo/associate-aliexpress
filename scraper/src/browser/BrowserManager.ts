import { chromium, type Page, type Browser } from "playwright";
import { spawn, type ChildProcess } from "node:child_process";
import { profileBootstrap, cleanSingletonLocks } from "./profileBootstrap.js";
import { config } from "../config.js";
import { stealthScript } from "../capture/stealth.js";

const CDP_URL = `http://localhost:${config.cdpPort}`;

class BrowserManager {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private chromeProcess: ChildProcess | null = null;
  private chromePid: number | null = null;
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
    this.browser = await chromium.connectOverCDP(CDP_URL);
    this.page = await this.attachPage();
    this.page.goto("https://shopee.com.br", { waitUntil: "networkidle" });
  }

  private async attachPage(): Promise<Page> {
    if (!this.browser) throw new Error("Browser not connected");
    const context = this.browser.contexts()[0];
    if (!context) {
      throw new Error(
        "No browser context available via CDP — profile may not be authenticated. " +
          "Log into Shopee once in this Chrome profile.",
      );
    }
    const page = context.pages()[0] ?? (await context.newPage());
    await page.addInitScript(stealthScript);
    return page;
  }

  private launchChrome(): void {
    const args = [
      `--user-data-dir=${config.profileDir}`,
      `--remote-debugging-port=${config.cdpPort}`,
      "--no-first-run",
      "--no-default-browser-check",
    ];
    this.chromeProcess = spawn(config.chromeExecutable, args, {
      detached: true,
      stdio: "ignore",
    });
    this.chromePid = this.chromeProcess.pid ?? null;
    this.chromeProcess.unref();
    console.log(`BrowserManager: Chrome launched (PID ${this.chromePid})`);
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
    if (this.browser?.isConnected() && this.page) return this.page;

    console.log("BrowserManager: reconnecting...");
    try {
      this.browser = await chromium.connectOverCDP(CDP_URL);
      this.page = await this.attachPage();
      return this.page;
    } catch {
      console.log("BrowserManager: reconnect failed, relaunching Chrome...");
      this.killChrome();
      cleanSingletonLocks(config.profileDir, true);
      this.launchChrome();
      await this.waitForCdp();
      this.browser = await chromium.connectOverCDP(CDP_URL);
      this.page = await this.attachPage();
      return this.page;
    }
  }

  isConnected(): boolean {
    return this.browser?.isConnected() ?? false;
  }

  async close(): Promise<void> {
    try {
      await this.browser?.close();
    } catch {}
    this.browser = null;
    this.page = null;
    this.killChrome();
  }

  private killChrome(): void {
    if (!this.chromePid) return;
    try {
      process.kill(this.chromePid, "SIGTERM");
    } catch {}
    const pid = this.chromePid;
    setTimeout(() => {
      try {
        process.kill(pid, "SIGKILL");
      } catch {}
    }, 5000);
    this.chromePid = null;
    this.chromeProcess = null;
  }
}

export const browserManager = new BrowserManager();
