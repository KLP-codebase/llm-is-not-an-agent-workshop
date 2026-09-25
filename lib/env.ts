// Loads .env from the repo root and gives every step the same settings.
import { config } from "dotenv";
import path from "node:path";

export const ROOT = path.join(import.meta.dirname, "..");

config({ path: path.join(ROOT, ".env"), quiet: true });

export const env = {
  model: process.env.MODEL || "gemini-3.5-flash-lite",
  harnessModel: process.env.HARNESS_MODEL || "gemini-3.8-flash",
  /** Set by `npm run check` so your code runs against a scripted model. No key, no network. */
  fake: process.env.FAKE_MODEL,
};

export function apiKey(): string {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key || key === "paste-your-key-here") {
    console.error(
      "\n❌ No Gemini API key found.\n" +
        "   1. Get one at https://aistudio.google.com/apikey\n" +
        "   2. Copy .env.example to .env and paste it in\n" +
        "   3. Run `npm run doctor`\n",
    );
    process.exit(1);
  }
  return key;
}
