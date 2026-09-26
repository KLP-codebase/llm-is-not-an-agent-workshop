# Step 5: The harness (Deep Agents)

```bash
npm run 5a   # state backend
npm run 5b   # filesystem backend
npm run 5c   # + skills
npm run 5d   # + memory
```

Remember your `while` loop from step 3? A **harness** is that loop plus what it needs to finish real work: a planner, a file system, skills and memory, all built in. This step uses [Deep Agents](https://docs.langchain.com/oss/javascript/deepagents/overview).

Each `index.ts` is the previous one plus one or two lines. Diff them to see exactly what each idea costs.

Each step is its own folder, and 5b, 5c and 5d each have their own `workspace/` (the agent's disk). So what's in a workspace is exactly what that step adds:

```
a-state-backend/        no workspace: files live in state
b-filesystem-backend/
  workspace/output/     where the agent writes
c-skills/
  workspace/skills/     + skills
d-memory/
  workspace/AGENTS.md   + a memory file
skill-template/         copy this to write your own skill
```

Try this in each one: **"Plan my week before the mid-sem"**

## What's built in

On top of your tools (`getWeather`, `getTimetable`), a deep agent gets:

| Tool | What it's for |
| --- | --- |
| `write_todos` | A to-do list. The agent plans, then ticks items off. (Added with `todoListMiddleware()`) |
| `ls`, `read_file`, `write_file`, `edit_file`, `glob`, `grep` | A file system to work in |
| `task` | Hands a job to a sub-agent with a clean context |

## 5a: Backends, part 1: state

Where do the agent's files actually go? That's the **backend**.

The default is `StateBackend`: files live *inside the agent's state*, next to the messages. Nothing touches your disk. At the end of each turn, 5a prints the files from state.

**Files are just state.** Same idea as the messages list in step 2.

## 5b: Backends, part 2: your disk

```ts
backend: new FilesystemBackend({ rootDir: workspace, virtualMode: true }),
```

Same agent, and now `write_file` writes real files. The agent's `/` is `b-filesystem-backend/workspace/`. `virtualMode: true` keeps it inside that folder.

After a run, open `b-filesystem-backend/workspace/output/plan.md`.

Other backends: `StoreBackend` (a database, shared across threads) and `CompositeBackend` (different folders go to different backends, e.g. `/memories/` to a store and everything else to state).

## 5c: Skills

```ts
skills: ["/skills/"],
```

> **Tools are what an agent can do. Skills are what it knows how to do, loaded only when needed.**

A skill is a folder with a `SKILL.md`. The agent sees only each skill's `name` and `description` up front. When a task matches, it reads the full file (watch for `📖 read_file(/skills/study-planner/SKILL.md)`). So you can have a hundred skills without bloating the prompt.

See `c-skills/workspace/skills/study-planner/SKILL.md`.

### Write your own skill (optional)

1. Copy `skill-template/` into `c-skills/workspace/skills/` and rename the folder, e.g. `c-skills/workspace/skills/dsa-exam-prep/`.
2. Set `name:` to the folder name and write a clear `description:`.
3. Write the instructions, the way you'd explain it to a friend.
4. `npm run check 5`, then `npm run 5c` and ask something that needs it.

## 5d: Memory

```ts
memory: ["/AGENTS.md"],
```

Step 4's checkpointer remembers a conversation until the program stops. This is different: `d-memory/workspace/AGENTS.md` is loaded into the system prompt on every run, and the agent edits it when it learns something about you. (5d keeps the skills from 5c too, so its workspace has its own copy of `skills/study-planner/`.)

```
You: I'm Nimal, CSE, and I'm weak at DSA
  ✏️  edit_file(file_path: "/AGENTS.md", ...)
You: exit
```

Run `npm run 5d` again and ask for a plan. It still knows. Open `d-memory/workspace/AGENTS.md` to see what it saved. (Reset it with `git checkout steps/05-deep-agents/d-memory/workspace/AGENTS.md`.)

| | Checkpointer (step 4) | Memory file (5d) |
| --- | --- | --- |
| What | The conversation | Facts worth keeping |
| Lives | In the program's memory | A file on disk |
| Survives a restart | No | Yes |

## Sub-agents (not in these files)

A sub-agent is another agent the main one can hand a job to with the `task` tool, e.g. "research the weather for the week and summarise it". It gets a fresh, clean context and returns only a summary, so the main agent's context stays small. You define them with `subagents: [{ name, description, systemPrompt, tools }]`. See the [sub-agents docs](https://docs.langchain.com/oss/javascript/deepagents/subagents).

## Models

Deep Agents makes many more model calls than step 4, and needs a stronger model to plan well. It uses `HARNESS_MODEL` from `.env`. On the free tier you may hit rate limits. The code waits and retries.
