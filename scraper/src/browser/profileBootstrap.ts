import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const SINGLETON_FILES = ["SingletonLock", "SingletonSocket", "SingletonCookie"];

function isPidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export function cleanSingletonLocks(profileDir: string, force = false): void {
  for (const name of SINGLETON_FILES) {
    const p = path.join(profileDir, name);
    try {
      const stat = fs.lstatSync(p);
      if (!force && stat.isSymbolicLink() && os.platform() !== "win32") {
        const target = fs.readlinkSync(p);
        const match = target.match(/-(\d+)$/);
        if (match && isPidAlive(Number(match[1]))) {
          throw new Error(
            `Profile ${profileDir} is in use by Chrome PID ${match[1]}. Stop it before launching the scraper.`,
          );
        }
      }
      fs.rmSync(p, { force: true });
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") continue;
      throw e;
    }
  }
}

export function profileBootstrap(profileDir: string): void {
  if (fs.existsSync(profileDir)) {
    cleanSingletonLocks(profileDir);
    return;
  }

  let sourceProfile: string;

  if (os.platform() === "win32") {
    sourceProfile = path.join(
      process.env.LOCALAPPDATA || "",
      "Google",
      "Chrome",
      "User Data",
      "Default",
    );
  } else {
    sourceProfile = path.join(os.homedir(), ".config", "google-chrome");
  }

  if (!fs.existsSync(sourceProfile)) {
    console.error("Google Chrome profile not found at:", sourceProfile);
    console.error("Install Google Chrome or adjust the profile path.");
    process.exit(1);
  }

  console.log("Copying Chrome profile to scraper profile dir...");
  console.warn("This may take a few minutes depending on profile size...");
  fs.cpSync(sourceProfile, profileDir, { recursive: true });
  cleanSingletonLocks(profileDir, true);
  console.log("Profile copied successfully.");
}
