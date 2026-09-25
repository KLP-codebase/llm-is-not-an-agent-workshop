// Step 1: an LLM is a function. Text in, text out. Nothing else.
//
// Try:  "Hi, I'm Nimal from CSE"   then   "What's my name?"
// It forgets, because every call starts from nothing.
import { GoogleGenAI } from "@google/genai";
import { ask, say } from "../../lib/cli.ts";
import { apiKey, env } from "../../lib/env.ts";

const ai = new GoogleGenAI({ apiKey: apiKey() });

console.log(`Campus Buddy, step 1: just an LLM (${env.model}). Type "exit" to quit.\n`);

while (true) {
  const input = await ask("You: ");

  // This is the whole thing. One request, one response, no memory.
  const response = await ai.models.generateContent({
    model: env.model,
    contents: input,
  });

  say(response.text ?? "");
}
