# LLM ≠ Agent

**What actually turns a model into an agent.**

In this repo you build Campus Buddy, a University of Moratuwa student assistant, one step at a time. It starts as a bare LLM call and ends as a full agent harness. Each step adds exactly one thing.

| Step | What it is | What it adds |
| --- | --- | --- |
| 1. LLM | A very smart function that forgets you instantly | Nothing. Text in, text out |
| 2. Chatbot | Memory is just you resending the whole list every time | State (the message history) |
| 3. Agent | It keeps going until it decides it's done | Tools, plus a loop where the model decides what to do next |
| 4. `createAgent` | The same agent, in about 10 lines | A framework that runs the loop for you |
| 5. Harness | The loop, with everything it needs to finish real work | Planning, a file system, skills, memory |

> **An agent is an LLM, plus state, plus tools, running in a loop.**

Built for a two-hour workshop at CSE, University of Moratuwa, on 1 Oct 2026. The [talk page](https://saai.syvendra.com/talks/llm-is-not-an-agent) has the setup steps and the [slides](https://saai.syvendra.com/talks/llm-is-not-an-agent/slides).

## Setup (do this before the session)

1. **Install Node 24 LTS** from [nodejs.org](https://nodejs.org). Anything from Node 22 up works.
2. **Get a free Gemini API key** at [aistudio.google.com/apikey](https://aistudio.google.com/apikey). Sign in with a Google account. No card needed.
3. **Clone and install:**
   ```bash
   git clone https://github.com/saai-syvendra/llm-is-not-an-agent.git
   cd llm-is-not-an-agent
   npm install
   ```
4. **Add your key:** copy `.env.example` to `.env` and paste your key after `GEMINI_API_KEY=`.
5. **Check everything:**
   ```bash
   npm run doctor
   ```
   If it ends with 🎉, you're ready.

## Commands

| Command | What it does |
| --- | --- |
| `npm run doctor` | Checks your setup |
| `npm run 1`, `npm run 2` | Runs the step 1 and 2 demos |
| `npm run 3`, `npm run 4` | Runs **your** code for steps 3 and 4 (`start.ts`) |
| `npm run 3:solution`, `npm run 4:solution` | Writes the finished version to `solution.ts` next to `start.ts`, then runs it |
| `npm run check 3`, `npm run check 4` | Tests your code against a scripted model. No key, no internet, instant |
| `npm run 5a` … `npm run 5d` | The step 5 harness, built up one idea at a time |
| `npm run check 5` | Checks the skills you've written |

Type `exit` to leave any chat.

## Where the code lives

```
steps/01-llm/             raw Gemini call, no memory
steps/02-chatbot/         a messages list, so it remembers
steps/03-agent-loop/      you write the agent loop          ← hands-on
steps/04-create-agent/    same agent with createAgent, plus your own tool   ← hands-on
steps/05-deep-agents/     Deep Agents: backends, skills, memory
lib/                      shared bits: model setup, tools, terminal helpers
data/timetable.json       a made-up CSE week for Campus Buddy to read
```

Each step folder has its own README that explains the idea.

## Stuck?

- **Behind in the session?** Open the next step's folder. Every step runs on its own.
- **`429` / rate limit errors:** the free tier allows only a few requests per minute. The code retries automatically. Wait a moment.
- **A model isn't available for your key:** change `MODEL` or `HARNESS_MODEL` in `.env`.
- **The weather API is down:** Campus Buddy prints a warning and uses sample weather. Everything else still works.

## Take-home challenge

1. Give Campus Buddy a tool that matters to you: bus times, the canteen menu, your real timetable.
2. Write a skill for something you know well, like how to prepare for a specific module's exam (see `steps/05-deep-agents/skill-template/`).
3. Ask it to do a task that needs both, and share a screenshot of the run.

## Where to go next

- [LangChain JS: agents](https://docs.langchain.com/oss/javascript/langchain/agents)
- [Deep Agents JS](https://docs.langchain.com/oss/javascript/deepagents/overview)
- Coding agents like Claude Code and Cursor are built on the same loop you wrote in step 3.
