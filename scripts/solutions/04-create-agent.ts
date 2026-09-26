// Step 4: you already wrote a framework.
//
// createAgent is the while loop from step 3: call the model, run the tools it asks for,
// push the results, repeat until it stops asking. Plus a checkpointer, which keeps the
// messages list for you (step 2's job), per conversation thread.
//
// Try:  "What do I have tomorrow, and will it rain?"
//       then "How many days until my DSA mid-sem?"
import { HumanMessage, createAgent, tool } from "langchain";
import { MemorySaver } from "@langchain/langgraph";
import { z } from "zod";
import { ask } from "../../lib/cli.ts";
import { chatModel } from "../../lib/model.ts";
import { showTurn } from "../../lib/print.ts";
import { getTimetable, getWeather, midSemExams, todayText } from "../../lib/tools.ts";

// Your own tool: a name, a description, a schema, and a function.
const daysUntilMidSem = tool(
  async ({ module }) => {
    const exams = midSemExams().filter((e) => !module || e.module.toLowerCase().includes(module.toLowerCase()));
    if (exams.length === 0) return `No mid-sem exam found for "${module}".`;
    return exams.map((e) => `${e.module}: ${e.date} at ${e.time} (${e.daysAway} days away)`).join("\n");
  },
  {
    name: "daysUntilMidSem",
    description: "How many days until the mid-semester exams, for one module or all of them.",
    schema: z.object({
      module: z.string().optional().describe("Part of a module name, e.g. 'DSA' or 'Math'. Leave out for all."),
    }),
  },
);

const agent = createAgent({
  model: chatModel(),
  tools: [getWeather, getTimetable, daysUntilMidSem],
  systemPrompt:
    "You are Campus Buddy, a friendly assistant for University of Moratuwa students. " +
    "The campus is in Moratuwa, Sri Lanka. " +
    `Today is ${todayText()}. ` +
    "Use your tools when you need live or personal information. Keep answers short and casual.",
  checkpointer: new MemorySaver(), // remembers each thread's messages between turns
});

// One conversation thread. A different thread_id would be a fresh conversation.
const config = { configurable: { thread_id: "nimal" } };

console.log(`Campus Buddy, step 4: createAgent. Type "exit" to quit.\n`);

while (true) {
  const input = await ask("You: ");
  // We only send the NEW message. The checkpointer adds the history.
  const result = await agent.invoke({ messages: [new HumanMessage(input)] }, config);
  showTurn(result.messages);
}
