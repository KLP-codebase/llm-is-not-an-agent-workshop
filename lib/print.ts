// Pretty-printing for agent runs, so you can watch the loop happen in the terminal.
import { HumanMessage, type AIMessage, type BaseMessage } from "langchain";
import { styleText } from "node:util";
import { dim, say } from "./cli.ts";

function short(args: Record<string, unknown>): string {
  const parts = Object.entries(args).map(([k, v]) => {
    const text = typeof v === "string" ? v : JSON.stringify(v);
    return `${k}: ${text.length > 60 ? JSON.stringify(text.slice(0, 57) + "...") : JSON.stringify(v)}`;
  });
  return parts.join(", ");
}

const ICONS: Record<string, string> = {
  write_file: "📝", edit_file: "✏️ ", read_file: "📖", ls: "📂", glob: "📂", grep: "🔎",
  write_todos: "🗒️ ", task: "🤖",
};

function printToolCalls(message: BaseMessage) {
  if (message.type !== "ai") return;
  for (const call of (message as AIMessage).tool_calls ?? []) {
    const args = call.name === "write_todos" ? "" : short(call.args); // the list prints itself
    console.log(dim(`  ${ICONS[call.name] ?? "🔧"} ${call.name}(${args})`));
  }
}

/** Step 4: print the tool calls made during the last turn, then the final answer. */
export function showTurn(messages: BaseMessage[]) {
  const start = messages.findLastIndex((m) => m.type === "human");
  messages.slice(start + 1).forEach(printToolCalls);
  say(messages.at(-1)!.text);
}

type Todo = { content: string; status: "pending" | "in_progress" | "completed" };

function printTodos(todos: Todo[]) {
  console.log(styleText("yellow", "  ┌ To-do list"));
  for (const t of todos) {
    const box = t.status === "completed" ? "✅" : t.status === "in_progress" ? "⏳" : "⬜";
    console.log(styleText("yellow", `  │ ${box} ${t.content}`));
  }
  console.log(styleText("yellow", "  └"));
}

/** Step 5: stream a Deep Agent run, printing to-dos and tool calls as they happen. Returns the final state. */
export async function runDeepAgent(agent: any, input: string, config: object) {
  const stream = await agent.stream(
    { messages: [new HumanMessage(input)] },
    { ...config, streamMode: ["updates", "values"], recursionLimit: 100 },
  );
  let answer = "";
  let state: any = {};
  for await (const [mode, chunk] of stream) {
    if (mode === "values") {
      state = chunk;
      continue;
    }
    for (const update of Object.values<any>(chunk)) {
      if (!update || typeof update !== "object") continue;
      if (Array.isArray(update.todos)) printTodos(update.todos);
      const messages: BaseMessage[] = [update.messages ?? []].flat();
      for (const m of messages) {
        printToolCalls(m);
        if (m.type === "ai" && !(m as AIMessage).tool_calls?.length && m.text) answer = m.text;
      }
    }
  }
  say(answer || "(done)");
  return state;
}

/** Step 5a: with the default StateBackend, "files" live inside the agent's state, not on disk. */
export function showStateFiles(files: Record<string, { content: string | string[] }> | undefined) {
  const entries = Object.entries(files ?? {});
  if (entries.length === 0) return;
  console.log(styleText("magenta", "📦 Files in agent state (nothing was written to your disk):"));
  for (const [file, data] of entries) {
    const text = Array.isArray(data.content) ? data.content.join("\n") : data.content;
    console.log(styleText("magenta", `\n── ${file} ──`));
    console.log(text);
  }
  console.log();
}
