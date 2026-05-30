import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const candidates = [
  path.resolve(__dirname, "../.env"),
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../.env"),
];

for (const envPath of candidates) {
  if (!fs.existsSync(envPath)) continue;
  const result = dotenv.config({ path: envPath });
  if (result.error) {
    console.warn(`[env] Failed to read ${envPath}:`, result.error.message);
    continue;
  }
  if (process.env.OPENAI_API_KEY?.trim()) {
    console.log(`[env] Loaded ${envPath}`);
    break;
  }
}
