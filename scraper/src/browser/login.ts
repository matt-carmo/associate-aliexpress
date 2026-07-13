import { chromium } from "playwright";
import * as readline from "node:readline";
import fs from "node:fs";
import { config } from "../config.js";

const SHOPEE_HOME = "https://shopee.com.br";
const SHOPEE_LOGIN_URL = "https://shopee.com.br/buyer/login";

async function interactiveLogin() {
  fs.mkdirSync(config.profileDir, { recursive: true });

  let context;
  try {
    context = await chromium.launchPersistentContext(config.profileDir, {
      channel: "chrome",
      headless: false,
      viewport: null,
      locale: "pt-BR",
      timezoneId: "America/Sao_Paulo",
      colorScheme: "light",
      permissions: [],
      serviceWorkers: "allow",
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
  } catch (err) {
    console.error("Failed to launch browser:");
    console.error(err);
    process.exit(1);
  }

  const page = context.pages()[0] ?? (await context.newPage());

  let navigated = false;
  for (const url of [SHOPEE_HOME, SHOPEE_LOGIN_URL]) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      navigated = true;
      console.log("Navigated to:", url);
      break;
    } catch (err) {
      console.error("Navigation to", url, "failed:", (err as Error).message);
    }
  }

  if (!navigated) {
    console.error("Could not navigate to Shopee. Check your internet connection.");
    await context.close();
    process.exit(1);
  }

  console.log("");
  console.log("Facao login no navegador aberto.");
  console.log("Pressione Enter aqui no terminal quando terminar.");
  console.log("");

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  await new Promise<void>((resolve) => {
    rl.question("> ", () => {
      rl.close();
      resolve();
    });
  });

  const snapshotPath = config.profileDir + ".snapshot.json";
  try {
    await context.storageState({ path: snapshotPath, indexedDB: true });
    console.log("Storage state salvo em", snapshotPath);
  } catch (err) {
    console.error("Failed to save storage state:", (err as Error).message);
  }

  await context.close();
  console.log("Login concluido. Sessao persistida em", config.profileDir);
}

interactiveLogin().catch((err) => {
  console.error("Login failed:", err);
  process.exit(1);
});
