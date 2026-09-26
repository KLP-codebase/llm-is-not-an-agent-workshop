// Step 5b: swap the backend. Same agent, but now its files are real files on your disk.
//
// FilesystemBackend maps the agent's "/" to the workspace/ folder next to this file.
// virtualMode: true keeps it inside that folder, so it can't wander around your laptop.
// Each of 5b, 5c and 5d has its own workspace/, so this one has no skills and no memory file.
//
// Try:  "Plan my week before the mid-sem", then open workspace/output/plan.md
import path from "node:path";
import { createDeepAgent, FilesystemBackend } from "deepagents";
import { todoListMiddleware } from "langchain";
import { MemorySaver } from "@langchain/langgraph";
import { ask } from "../../../lib/cli.ts";
import { harnessModel } from "../../../lib/model.ts";
import { runDeepAgent } from "../../../lib/print.ts";
import { getTimetable, getWeather, todayText } from "../../../lib/tools.ts";

const workspace = path.join(import.meta.dirname, "workspace");

const agent = createDeepAgent({
  model: harnessModel(),
  tools: [getWeather, getTimetable],
  systemPrompt:
    "You are Campus Buddy, a study assistant for University of Moratuwa students (campus in Moratuwa, Sri Lanka). " +
    `Today is ${todayText()}. ` +
    "For bigger tasks: make a to-do list first, gather what you need with your tools, " +
    "then save the result as a Markdown file in /output/. Keep chat replies short; put the detail in the file.",
  middleware: [todoListMiddleware()],
  checkpointer: new MemorySaver(),
  backend: new FilesystemBackend({ rootDir: workspace, virtualMode: true }), // NEW: real files
});

const config = { configurable: { thread_id: "nimal" } };
console.log(`Campus Buddy, step 5b: Deep Agents + FilesystemBackend. Type "exit" to quit.\n`);
console.log(`The agent's disk is: ${path.relative(process.cwd(), workspace)}\n`);

while (true) {
  const input = await ask("You: ");
  await runDeepAgent(agent, input, config);
}
