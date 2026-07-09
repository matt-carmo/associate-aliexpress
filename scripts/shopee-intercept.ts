import { chromium } from 'playwright';
import { stealthScript } from './brave-stealth';

const TARGET_URL = 'https://shopee.com.br/Scooter-El%C3%A9trica-1000W-WeHawk-Super-WX-05-%E2%80%93-Bateria-Chumbo-60V-20Ah-2-Lugares-Autonomia-60Km-%F0%9F%87%A7%F0%9F%87%B7-i.919559444.23999022725';

async function main() {
  const browser = await chromium.launch({
    headless: false,
    executablePath: '/usr/bin/google-chrome',
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-site-isolation-trials',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-infobars',
      '--disable-sync',
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 500 },
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    permissions: [],
  });

  const page = await context.newPage();
  await page.addInitScript(stealthScript);

  const captured: { apiResponse: Record<string, unknown> | null; apiRequest: Record<string, unknown> | null } = { apiResponse: null, apiRequest: null };

  page.on('request', (req) => {
    if (req.url().includes('/api/v4/pdp/get_pc')) {
      captured.apiRequest = {
        url: req.url(),
        method: req.method(),
        headers: req.headers(),
        postData: req.postData(),
      };
    }
  });

  page.on('response', async (res) => {
    if (res.url().includes('/api/v4/pdp/get_pc')) {
      try {
        const body = await res.json();
        captured.apiResponse = { url: res.url(), status: res.status(), headers: res.headers(), body };
      } catch {
        const text = await res.text();
        captured.apiResponse = { url: res.url(), status: res.status(), headers: res.headers(), body: text };
      }
    }
  });

  console.log('Step 1: Visiting homepage to get cookies...');
  await page.goto('https://shopee.com.br', { waitUntil: 'networkidle', timeout: 30000 });
  console.log('Homepage loaded');

  const cookies1 = await context.cookies();
  console.log('Cookies after homepage:', cookies1.length);

  console.log('\nStep 2: Navigating to product page...');
  await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 60000 });

  await new Promise(r => setTimeout(r, 5000));

  console.log('\n=== Captured API Request ===');
  console.log(captured.apiRequest ? JSON.stringify(captured.apiRequest, null, 2) : 'Not captured');

  console.log('\n=== Captured API Response ===');
  console.log(captured.apiResponse ? JSON.stringify(captured.apiResponse, null, 2) : 'Not captured');

  const cookies2 = await context.cookies();
  console.log('\nCookies after product page:', cookies2.length);

  const pageText = await page.evaluate(() => document.body?.innerText?.substring(0, 1000));
  console.log('\n=== Page Text ===');
  console.log(pageText || '(empty)');

  console.log('\n=== All Cookies ===');
  cookies2.forEach(c => console.log(`${c.name}: ${c.value.substring(0, 50)}...`));

  await page.screenshot({ path: '/tmp/shopee-page.png' });
  console.log('\nScreenshot saved');

  await browser.close();
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
