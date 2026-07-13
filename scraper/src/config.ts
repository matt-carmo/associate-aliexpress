import path from "node:path";

const env = process.env;

function resolveProfileDir(): string {
  if (env.PROFILE_DIR) return env.PROFILE_DIR;

  return path.resolve(import.meta.dirname, "..", ".chrome-profile");
}

export const config = {
  port: Number(env.PORT) || 4001,
  corsOrigin: env.CORS_ORIGIN || "http://localhost:3000",
  headless: env.SHOPEE_HEADLESS !== "false",
  pdpTimeoutMs: Number(env.PDP_TIMEOUT_MS) || 30000,
  maxQueue: Number(env.MAX_QUEUE) || 20,
  profileDir: resolveProfileDir(),
} as const;
