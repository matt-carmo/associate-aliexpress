const env = process.env;

function resolveProfileDir(): string {
  if (env.PROFILE_DIR) return env.PROFILE_DIR;
  return `${import.meta.dirname}/../../.chrome-profile`;
}

export const config = {
  port: Number(env.PORT) || 4001,
  corsOrigin: env.CORS_ORIGIN || "http://localhost:3000",
  chromeExecutable: env.CHROME_EXECUTABLE || "google-chrome",
  cdpPort: Number(env.CDP_PORT) || 9222,
  pdpTimeoutMs: Number(env.PDP_TIMEOUT_MS) || 30000,
  maxQueue: Number(env.MAX_QUEUE) || 20,
  profileDir: resolveProfileDir(),
} as const;
