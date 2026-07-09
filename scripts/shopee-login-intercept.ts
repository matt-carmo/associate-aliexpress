import { chromium } from 'playwright';
import * as readline from 'readline';
import { stealthScript } from './brave-stealth';

const PROFILE_DIR = '/home/matt-carni/Documents/personal-projects/associate-affiliate/.chrome-profile';
const TARGET_URL = 'https://shopee.com.br/Scooter-El%C3%A9trica-1000W-WeHawk-Super-WX-05-%E2%80%93-Bateria-Chumbo-60V-20Ah-2-Lugares-Autonomia-60Km-%F0%9F%87%A7%F0%9F%87%B7-i.919559444.23999022725';

async function waitForEnter(msg: string): Promise<void> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(msg, () => { rl.close(); resolve(); }));
}

async function main() {
  const browser = await chromium.launch({
    headless: false,
    executablePath: '/usr/bin/google-chrome',
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-infobars',
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    permissions: [],
  });

  const page = await context.newPage();
  await page.addInitScript(stealthScript);

  console.log('Abrindo Shopee... faça login manualmente na janela que abriu.');
  console.log('Use um perfil já logado ou faça login normalmente.\n');
  await page.goto('https://shopee.com.br', { waitUntil: 'networkidle', timeout: 60000 });

  await waitForEnter('Pressione Enter DEPOIS de estar logado...\n');

  console.log('\nNavegando para a página do produto...');
  await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 60000 });

  await new Promise(r => setTimeout(r, 8000));

  const title = await page.title();
  const text = await page.evaluate(() => document.body?.innerText?.substring(0, 1000));
  console.log('\nPage title:', title);
  console.log('Page text:', text || '(empty)');

  await waitForEnter('\nPressione Enter para fechar o navegador...');
  await browser.close();
  console.log('Navegador fechado.');
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
