// Step 5c: skills.
//
// Tools are what an agent can DO. Skills are what it knows HOW to do.
// A skill is a folder with a SKILL.md. The agent only sees each skill's name and
// description up front, and reads the full file when a task needs it.
// That keeps the prompt small no matter how many skills you add.
// The skills live in workspace/skills/ next to this file.
//
// Try:  "Plan my week before the mid-sem"   (watch for 📖 read_file .../SKILL.md)
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
  backend: new FilesystemBackend({ rootDir: workspace, virtualMode: true }),
  skills: ["/skills/"], // NEW: every folder in workspace/skills/ with a SKILL.md
});

const config = { configurable: { thread_id: "nimal" } };
console.log(`Campus Buddy, step 5c: Deep Agents + skills. Type "exit" to quit.\n`);

while (true) {
  const input = await ask("You: ");
  await runDeepAgent(agent, input, config);
}
