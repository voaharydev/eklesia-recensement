import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export function loadEnvLocal(rootDir: string): void {
  try {
    const raw = readFileSync(resolve(rootDir, ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // optional if vars already exported
  }
}
