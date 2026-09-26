// `npm run 3:solution` / `npm run 4:solution`
// Copies the finished version next to your start.ts, then runs it.
// The solutions live in scripts/solutions/ so they aren't sitting beside the exercise.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { styleText } from "node:util";
import { ROOT } from "../lib/env.ts";

const folders: Record<string, string> = { "3": "03-agent-loop", "4": "04-create-agent" };
const folder = folders[process.argv[2]];
if (!folder) {
  console.log("Usage: npm run 3:solution   (or 4:solution)");
  process.exit(1);
}

const src = path.join(ROOT, "scripts", "solutions", `${folder}.ts`);
const dest = path.join(ROOT, "steps", folder, "solution.ts");
fs.copyFileSync(src, dest);
console.log(styleText("dim", `📄 Wrote ${path.relative(ROOT, dest)}. Compare it with start.ts.\n`));

await import(pathToFileURL(dest).href);
