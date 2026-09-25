// `npm run doctor`: checks your setup before the session. Green means you're ready.
import fs from "node:fs";
import path from "node:path";
import { styleText } from "node:util";
import { ROOT, env } from "../lib/env.ts";

let ok = true;
const good = (msg: string) => console.log(styleText("green", `✅ ${msg}`));
const warn = (msg: string) => console.log(styleText("yellow", `⚠️  ${msg}`));
const bad = (msg: string, fix: string) => {
  ok = false;
  console.log(styleText("red", `❌ ${msg}`));
  console.log(`   ${fix}`);
};

console.log(styleText("bold", "\nChecking your setup for LLM ≠ Agent...\n"));

// 1. Node version
const major = Number(process.versions.node.split(".")[0]);
if (major >= 22) good(`Node ${process.versions.node}`);
else bad(`Node ${process.versions.node} is too old.`, "Install Node 24 LTS from https://nodejs.org");

// 2. Packages
const packages = ["langchain", "@langchain/google", "@langchain/langgraph", "deepagents", "@google/genai"];
const missing = packages.filter((p) => !fs.existsSync(path.join(ROOT, "node_modules", p)));
if (missing.length === 0) good("Packages installed");
else bad(`Missing packages: ${missing.join(", ")}`, "Run `npm install` in the repo folder.");

// 3. API key
const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
if (!fs.existsSync(path.join(ROOT, ".env"))) {
  bad("No .env file.", "Copy .env.example to .env and paste your key from https://aistudio.google.com/apikey");
} else if (!key || key === "paste-your-key-here") {
  bad("GEMINI_API_KEY is not set in .env.", "Paste your key from https://aistudio.google.com/apikey");
} else {
  good("API key found in .env");

  // 4. One tiny real call, for each model we use
  if (missing.length === 0) {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: key });
    for (const model of [env.model, env.harnessModel]) {
      // Step 5 is a demo in the session, so a problem with the harness model is only a warning.
      const fail = model === env.model ? bad : (msg: string, fix: string) => warn(`${msg} (Only needed for step 5.) ${fix}`);
      try {
        const res = await ai.models.generateContent({ model, contents: "Reply with just: OK" });
        good(`Gemini answered (${model}): ${res.text?.trim().slice(0, 20)}`);
      } catch (err: any) {
        const msg = String(err?.message ?? err);
        if (/API key not valid|API_KEY_INVALID|PERMISSION_DENIED|401|403/.test(msg)) {
          fail(`Gemini rejected your key (${model}).`, "Copy the key again from AI Studio. No spaces or quotes in .env.");
        } else if (/not found|404|not supported/i.test(msg)) {
          fail(`Model "${model}" isn't available for your key.`, "Change MODEL / HARNESS_MODEL in .env (see .env.example).");
        } else if (/429|quota|RESOURCE_EXHAUSTED/i.test(msg)) {
          warn(`Rate limited on ${model}. Your key works; wait a minute and try again.`);
        } else {
          fail(`Gemini call failed (${model}): ${msg.slice(0, 150)}`, "Check your internet connection and try again.");
        }
      }
    }
  }
}

// 5. Weather API (optional: there's a built-in fallback)
try {
  const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=6.79&longitude=79.9&current=temperature_2m", {
    signal: AbortSignal.timeout(5000),
  });
  if (res.ok) good("Weather API reachable");
  else warn("Weather API returned an error. Not a problem: Campus Buddy falls back to sample weather.");
} catch {
  warn("Weather API unreachable. Not a problem: Campus Buddy falls back to sample weather.");
}

console.log(
  ok
    ? styleText(["bold", "green"], "\n🎉 You're ready for the session!\n")
    : styleText(["bold", "red"], "\nFix the ❌ items above, then run `npm run doctor` again.\n"),
);
process.exit(ok ? 0 : 1);
