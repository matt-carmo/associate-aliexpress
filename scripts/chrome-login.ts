import { chromium } from "playwright";
import * as path from "path";
import fs from "fs";
import { exec } from "child_process";
import os from "os";

const PROFILE_DIR = `${__dirname}/../.chrome-profile`;
const STEALTH_SCRIPT = ("brave-stealth.ts");

function initChrome(): void {
  exec(
    `google-chrome --user-data-dir=${PROFILE_DIR} --remote-debugging-port=9222`
  )
}


export async function page() {

  const firstRun = fs.existsSync(PROFILE_DIR);

  if (!firstRun) {
    let sourceProfile;

    if (os.platform() === 'win32') {

      sourceProfile = path.join(
        '%LOCALAPPDATA%\Google\Chrome\User Data\Default',
        'Google',
        'Chrome',
        'User Data'
      );
    } else {
      sourceProfile = path.join(
        os.homedir(),
        '.config',
        'google-chrome'
      );
    }
    if (!fs.existsSync(sourceProfile)) {
      console.error('\n❌ Google Chrome não foi encontrado neste computador.');
      console.error(`Perfil esperado em: ${sourceProfile}`);
      console.error('Instale o Google Chrome ou ajuste o caminho do perfil.\n');
      process.exit(1);
    }
    console.log('Copiando perfil do Google Chrome para o diretório de perfil do Playwright...');
    console.warn('Isso pode levar alguns minutos dependendo do tamanho do perfil...');
    fs.cpSync(sourceProfile, PROFILE_DIR, {
      recursive: true,
    });
    console.log('Perfil copiado com sucesso para o diretório de perfil do Playwright.');
  }

  initChrome();

  const browser = await chromium.connectOverCDP("http://localhost:9222");
  const context = browser.contexts()[0];

  const page = context.pages()[0]

  return page;
}
