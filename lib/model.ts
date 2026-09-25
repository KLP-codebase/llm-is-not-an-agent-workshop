// One place to create the chat model, so switching models is one line in .env.
import { ChatGoogle } from "@langchain/google/node";
import { apiKey, env } from "./env.ts";
import { fakeModelFor } from "./fake-model.ts";

/** The everyday model (steps 2 to 4). Retries automatically on free-tier rate limits (429). */
export function chatModel(): ChatGoogle {
  if (env.fake) return fakeModelFor(env.fake) as unknown as ChatGoogle;
  return new ChatGoogle({ model: env.model, apiKey: apiKey(), maxRetries: 6 });
}

/** A stronger model for the Deep Agents harness (step 5). */
export function harnessModel(): ChatGoogle {
  return new ChatGoogle({ model: env.harnessModel, apiKey: apiKey(), maxRetries: 6 });
}
