const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const PROFILE_DIR = path.resolve(__dirname, '..', '.chrome-profile');
const STEALTH_SCRIPT = path.resolve(__dirname, 'brave-stealth.js');

const stealthScript = fs.readFileSync(STEALTH_SCRIPT, 'utf8');

async function main() {
  console.log('=== Chrome Login Helper ===');
  console.log(`Profile: ${PROFILE_DIR}`);

  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages().find(p => p.url().startsWith('https://shopee.com.br'))

  // await context.addInitScript(stealthScript);

  console.log('Navegador Chrome aberto com perfil persistente.');
  console.log('Faça login na Shopee normalmente.');
  console.log('');
  console.log('APÓS o login, pressione Ctrl+C para fechar.');
  console.log('O perfil salvará cookies e sessão para o MCP.\n');

  await page.goto('https://shopee.com.br');
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
