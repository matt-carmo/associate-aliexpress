import type { Page } from "playwright";

const SHOPEE_LOGIN_URL_RE = /\/buyer\/login/;

export class ShopeeSessionExpiredError extends Error {
  constructor(message = "Shopee session expired — re-authenticate with npm run scrape:login") {
    super(message);
    this.name = "SHOPEE_SESSION_EXPIRED";
    this.code = "SHOPEE_SESSION_EXPIRED";
  }
}

declare global {
  interface Error {
    code?: string;
  }
}

export async function assertShopeeSession(page: Page): Promise<void> {
  const url = page.url();

  if (SHOPEE_LOGIN_URL_RE.test(url)) {
    throw new ShopeeSessionExpiredError();
  }

  const hasLoginButton = await page
    .locator('a:has-text("Entrar"), button:has-text("Entrar")')
    .first()
    .isVisible({ timeout: 2000 })
    .catch(() => false);

  if (hasLoginButton) {
    throw new ShopeeSessionExpiredError();
  }
}
