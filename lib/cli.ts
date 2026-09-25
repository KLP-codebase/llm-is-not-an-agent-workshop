// A tiny terminal chat helper: `const input = await ask("You: ")`.
// Type `exit` (or press Ctrl+C) to quit.
import readline from "node:readline";
import { styleText } from "node:util";

const rl = readline.createInterface({ input: process.stdin, terminal: false });
const lines = rl[Symbol.asyncIterator]();

export async function ask(prompt: string): Promise<string> {
  process.stdout.write(styleText("bold", prompt));
  const next = await lines.next();
  const input = next.done ? "exit" : next.value.trim();

  if (!process.stdin.isTTY) process.stdout.write(input + "\n"); // echo piped input
  if (input === "exit" || input === "quit") {
    rl.close();
    // Exit only after everything printed so far has been flushed.
    process.stdout.write("", () => process.exit(0));
    return new Promise(() => {});
  }
  if (!input) return ask(prompt);
  return input;
}

export const dim = (text: string) => styleText("dim", text);
export const say = (text: string) => console.log(`${styleText(["bold", "cyan"], "Buddy:")} ${text}\n`);
