# Step 3: The agent loop (hands-on)

```bash
npm run check 3     # test your code (no key needed)
npm run 3           # chat with your agent
npm run 3:solution  # the finished version
```

**Agent = LLM + state + tools, running in a loop.**

## The idea

The model can't check the weather. But it can *ask you to*. That's a **tool call**.

A tool is four things: a **name**, a **description**, a **schema** (what arguments it takes) and a **function**. The model only ever sees the first three. `getWeather` lives in `lib/tools.ts`.

When the model wants a tool, its reply has `tool_calls` instead of an answer. Your code:

1. runs the tool,
2. pushes the result back as a `ToolMessage`,
3. calls the model again.

Keep going until the model stops asking for tools. **That loop is the agent.**

```
you ──► model ──► tool call? ──yes──► run tool ──► push result ──┐
            ▲                                                      │
            └──────────────────────────────────────────────────────┘
                         no ──► answer
```

## Two loops

`start.ts` has two `while` loops, and the difference matters:

- The **chat loop** (outside): *you* drive it. One lap per thing you type.
- The **agent loop** (inside): the *model* drives it. It decides how many laps.

## Your TODOs (in `start.ts`)

- **(a)** The loop condition. Keep looping while the model is asking for tools.
- **(b1)** For each tool call, find the tool, run it, and push a `ToolMessage` with the result and `tool_call_id: call.id`.
- **(b2)** Call the model again, store it in `reply`, and push `reply` onto `messages`.

Then `npm run check 3`. The hints tell you what's missing.

## Why push `reply` as-is?

The model needs to see its own request in the history right before the result, otherwise the result makes no sense to it. Gemini also attaches a hidden signature to its tool calls and rejects the next request if that's missing. So always push the message object you got back. Don't rebuild it.

## Try it

```
You: Should I walk to campus or take the bus?
  🔧 getWeather({"city":"Moratuwa"})
Buddy: ...
```
