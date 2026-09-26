// Step 5a: a harness. Same loop as step 3, with planning and a file system built in.
//
// Deep Agents gives the agent built-in tools on top of yours:
//   write_todos (a to-do list), ls / read_file / write_file / edit_file (files), task (sub-agents).
// Where do those files go? That's the BACKEND. The default is StateBackend:
// files live inside the agent's state, next to the messages. Nothing touches your disk.
//
// Try:  "Plan my week before the mid-sem"
import { createDeepAgent } from "deepagents";
import { todoListMiddleware } from "langchain";
import { MemorySaver } from "@langchain/langgraph";
import { ask } from "../../../lib/cli.ts";
import { harnessModel } from "../../../lib/model.ts";
import { runDeepAgent, showStateFiles } from "../../../lib/print.ts";
import { getTimetable, getWeather, todayText } from "../../../lib/tools.ts";

const agent = createDeepAgent({
  model: harnessModel(),
  tools: [getWeather, getTimetable],
  systemPrompt:
    "You are Campus Buddy, a study assistant for University of Moratuwa students (campus in Moratuwa, Sri Lanka). " +
    `Today is ${todayText()}. ` +
    "For bigger tasks: make a to-do list first, gather what you need with your tools, " +
    "then save the result as a Markdown file in /output/. Keep chat replies short; put the detail in the file.",
  middleware: [todoListMiddleware()], // the planner: adds the write_todos tool
  checkpointer: new MemorySaver(),
});

const config = { configurable: { thread_id: "nimal" } };
console.log(`Campus Buddy, step 5a: Deep Agents + StateBackend. Type "exit" to quit.\n`);

while (true) {
  const input = await ask("You: ");
  const state = await runDeepAgent(agent, input, config);
  showStateFiles(state.files); // the "files" are just part of the state
}
