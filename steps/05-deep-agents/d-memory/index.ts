// Step 5d: long-term memory.
//
// Step 4's checkpointer remembers a conversation, until the program stops.
// Memory here is a file: workspace/AGENTS.md is loaded into the system prompt at startup,
// and the agent edits it when it learns something about you. Quit, restart, it still knows.
//
// Try:  "I'm Nimal, CSE, and I'm weak at DSA"   then "exit", run again, and ask
//       "Plan my week before the mid-sem"
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
  skills: ["/skills/"],
  memory: ["/AGENTS.md"], // NEW: loaded every run, and the agent can edit it
});

const config = { configurable: { thread_id: "nimal" } };
console.log(`Campus Buddy, step 5d: Deep Agents + memory. Type "exit" to quit.\n`);

while (true) {
  const input = await ask("You: ");
  await runDeepAgent(agent, input, config);
}
