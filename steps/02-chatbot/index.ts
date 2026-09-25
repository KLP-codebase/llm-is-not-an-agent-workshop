// Step 2: a chatbot is an LLM plus state.
//
// The model still forgets everything between calls.
// *You* remember for it, by resending the whole conversation every time.
import { HumanMessage, SystemMessage, type BaseMessage } from "langchain";
import { ask, dim, say } from "../../lib/cli.ts";
import { chatModel } from "../../lib/model.ts";

const model = chatModel();

// The state. A system prompt at the top, then every message so far.
const messages: BaseMessage[] = [
  new SystemMessage(
    "You are Campus Buddy, a friendly assistant for University of Moratuwa students. " +
      "Keep answers short and casual.",
  ),
];

console.log(`Campus Buddy, step 2: a chatbot. Type "exit" to quit.\n`);

while (true) {
  const input = await ask("You: ");
  messages.push(new HumanMessage(input));

  const reply = await model.invoke(messages); // the WHOLE list, every time
  messages.push(reply);

  say(reply.text);
  console.log(dim(`(sent ${messages.length - 1} messages to the model this time)\n`));
}
