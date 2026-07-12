import os from "node:os";
import fs from "node:fs";
import path from "node:path";

const env = process.env;

function resolveProfileDir(): string {
  if (env.PROFILE_DIR) return env.PROFILE_DIR;

  if (os.platform() === "win32") {
    return path.join(process.env.LOCALAPPDATA ?? "", "Google", "Chrome", "User Data");
  }
  return path.join(os.homedir(), ".config", "google-chrome");
}

function resolveChromeExecutable(): string {
  if (env.CHROME_EXECUTABLE) return env.CHROME_EXECUTABLE;
  if (os.platform() !== "win32") return "google-chrome";

  const candidates = [
    path.join(process.env.ProgramFiles ?? "", "Google", "Chrome", "Application", "chrome.exe"),
    path.join(process.env["ProgramFiles(x86)"] ?? "", "Google", "Chrome", "Application", "chrome.exe"),
    path.join(process.env.LOCALAPPDATA ?? "", "Google", "Chrome", "Application", "chrome.exe"),
  ];
  for (const c of candidates) {
    if (c && fs.existsSync(c)) return c;
  }
  return "chrome";
}

export const config = {
  port: Number(env.PORT) || 4001,
  corsOrigin: env.CORS_ORIGIN || "http://localhost:3000",
  chromeExecutable: resolveChromeExecutable(),
  cdpPort: Number(env.CDP_PORT) || 9222,
  pdpTimeoutMs: Number(env.PDP_TIMEOUT_MS) || 30000,
  maxQueue: Number(env.MAX_QUEUE) || 20,
  profileDir: resolveProfileDir(),
} as const;

console.log(config)