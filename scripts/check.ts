// `npm run check 3` / `npm run check 4` / `npm run check 5`
// Tests your code against a scripted model: no API key, no network, instant.
// Add `--solution` to run the check against the solution file instead (for sanity checks).
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { styleText } from "node:util";
import { parseSkillMetadata } from "deepagents";
import { ROOT } from "../lib/env.ts";

const args = process.argv.slice(2);
const step = args.find((a) => !a.startsWith("--"));
const useSolution = args.includes("--solution");
const verbose = args.includes("--verbose");

const pass = (msg: string) => console.log(styleText("green", `✅ ${msg}`));
function fail(msg: string, hint?: string): never {
  console.log(styleText("red", `❌ ${msg}`));
  if (hint) console.log(`   ${styleText("yellow", "Hint:")} ${hint}`);
  process.exit(1);
}

type Run = { stdout: string; stderr: string; code: number | null; timedOut: boolean; reports: any[] };

/** Runs a step file with the scripted model, types `lines` into it, and collects what happened. */
function run(file: string, fakeStep: string, lines: string[]): Promise<Run> {
  return new Promise((resolve) => {
    const tsx = path.join(ROOT, "node_modules", "tsx", "dist", "cli.mjs");
    const child = spawn(process.execPath, [tsx, file], {
      cwd: ROOT,
      env: { ...process.env, FAKE_MODEL: fakeStep, NO_COLOR: "1" },
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.stdin.end(lines.join("\n") + "\n");

    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, 15_000);

    child.on("close", (code) => {
      clearTimeout(timer);
      const reports = stderr
        .split("\n")
        .filter((l) => l.startsWith("__CHECK__ "))
        .map((l) => JSON.parse(l.slice("__CHECK__ ".length)));
      if (verbose) console.log(styleText("dim", `--- stdout ---\n${stdout}\n--- stderr ---\n${stderr}`));
      resolve({ stdout, stderr, code, timedOut, reports });
    });
  });
}

const errorText = (r: Run) =>
  r.stderr.split("\n").filter((l) => l && !l.startsWith("__CHECK__")).slice(0, 6).join("\n   ");

function stepFile(folder: string) {
  return path.join("steps", folder, useSolution ? "solution.ts" : "start.ts");
}

// ---------------------------------------------------------------------------

async function check3() {
  const file = stepFile("03-agent-loop");
  console.log(`Checking ${file} ...\n`);
  const r = await run(file, "3", ["Should I walk to campus or take the bus?"]);
  const calls = r.reports.find((x) => "calls" in x)?.calls ?? 0;
  const problems = r.reports.filter((x) => x.problem).map((x) => x.problem);

  if (r.timedOut) {
    fail("Your agent loop never stops.", "After running the tools, call the model again and store the answer in `reply`. Otherwise `reply.tool_calls` never changes.");
  }
  if (!r.stdout.includes("🔧 getWeather")) {
    fail("The agent loop never ran.", "TODO (a): the while loop should keep going while `reply.tool_calls` has items, e.g. `while (reply.tool_calls?.length)`.");
  }
  pass("The loop runs when the model asks for a tool");

  if (calls < 2) {
    fail("You never asked the model again after running the tool.", "TODO (b2): `reply = await model.invoke(messages)`, then push `reply` onto `messages`.");
  }
  if (calls > 2 || r.code !== 0) {
    fail("The model was called too many times, or your code crashed.", `Run with --verbose to see the output.\n   ${errorText(r)}`);
  }
  if (problems.includes("no_tool_message")) {
    fail("The model never saw the tool's result.", "TODO (b1): push `new ToolMessage({ content: String(result), tool_call_id: call.id! })` onto `messages`.");
  }
  if (problems.includes("wrong_tool_call_id")) {
    fail("The ToolMessage has the wrong tool_call_id.", "Use `call.id`, so the model knows which request this result answers.");
  }
  if (problems.includes("missing_ai_message")) {
    fail("The model's tool-call message is missing from `messages`.", "Push `reply` itself right after every `model.invoke`. Gemini needs to see its own request before the result.");
  }
  pass("The tool result goes back to the model");

  if (!r.stdout.includes("29°C")) {
    fail("The final answer doesn't include the weather.", "Print `reply.text` after the loop finishes.");
  }
  pass("The final answer uses the tool result");
  console.log(styleText("green", "\n🎉 Step 3 passed. You just built an agent. Try it for real: npm run 3"));
}

async function check4() {
  const file = stepFile("04-create-agent");
  console.log(`Checking ${file} ...\n`);
  const r = await run(file, "4", ["hi"]);
  const tools: { name: string; description: string; hasSchema: boolean }[] =
    r.reports.find((x) => x.tools)?.tools ?? [];

  if (tools.length === 0) {
    fail("Your agent didn't start.", `Run with --verbose to see the output.\n   ${errorText(r)}`);
  }
  const mine = tools.find((t) => t.name !== "getWeather" && t.name !== "getTimetable");
  if (!mine) {
    fail("Only the built-in tools were found.", "Write your own tool with `tool(...)` and add it to the `tools: [...]` list.");
  }
  pass(`Found your tool: ${mine.name}`);

  if (mine.description.trim().length < 15) {
    fail("Your tool's description is too short.", "The model decides when to use a tool by reading its description. Say what it does and when to use it.");
  }
  if (!mine.hasSchema) fail("Your tool has no schema.", "Add `schema: z.object({ ... })`.");
  pass("It has a description and a schema");

  const ran = r.reports.find((x) => x.toolRan);
  if (!ran) fail("Your tool was never called.", `Run with --verbose to see the output.\n   ${errorText(r)}`);
  if (ran.status === "error" || ran.result.startsWith("Error:")) {
    fail("Your tool threw an error when called with sample arguments.", `It returned: ${ran.result}`);
  }
  pass(`It runs. It returned: ${JSON.stringify(ran.result.slice(0, 80))}`);
  console.log(styleText("green", "\n🎉 Step 4 passed. Now chat with it for real: npm run 4"));
}

function check5() {
  const skillsDir = path.join(ROOT, "steps", "05-deep-agents", "workspace", "skills");
  const folders = fs.readdirSync(skillsDir, { withFileTypes: true }).filter((d) => d.isDirectory());
  console.log(`Checking skills in ${path.relative(ROOT, skillsDir)} ...\n`);

  for (const folder of folders) {
    const file = path.join(skillsDir, folder.name, "SKILL.md");
    if (!fs.existsSync(file)) fail(`${folder.name}/ has no SKILL.md`, "Every skill folder needs a SKILL.md file.");
    const meta = parseSkillMetadata(file, "project");
    if (!meta) {
      fail(`${folder.name}/SKILL.md can't be read as a skill.`, "It must start with frontmatter:\n   ---\n   name: my-skill\n   description: What it does and when to use it\n   ---");
    }
    if (meta.name !== folder.name) {
      fail(`${folder.name}/SKILL.md says name: ${meta.name}`, `The name must match the folder name exactly: name: ${folder.name}`);
    }
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(meta.name)) {
      fail(`"${meta.name}" isn't a valid skill name.`, "Use lowercase letters, numbers and hyphens, e.g. dsa-exam-prep.");
    }
    if (meta.description.trim().length < 20) {
      fail(`${meta.name}: the description is too short.`, "The agent only sees the description until it decides to open the skill. Say what it's for and when to use it.");
    }
    pass(`${meta.name}: ${meta.description.slice(0, 70)}${meta.description.length > 70 ? "..." : ""}`);
  }
  console.log(styleText("green", `\n🎉 ${folders.length} skill(s) look good. Try them: npm run 5c`));
}

// ---------------------------------------------------------------------------

if (step === "3") await check3();
else if (step === "4") await check4();
else if (step === "5") check5();
else {
  console.log("Usage: npm run check 3   (or 4, or 5)");
  console.log("Steps 1 and 2 are demos, so there's nothing to check.");
  process.exit(1);
}
