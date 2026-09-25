# Step 4: `createAgent` (hands-on)

```bash
npm run check 4     # test your tool (no key needed)
npm run 4           # chat with your agent
npm run 4:solution  # the finished version
```

## You already wrote a framework

`createAgent` does exactly what your step 3 loop does: call the model, run the tools it asks for, push the results, repeat until it stops asking. Compare `../03-agent-loop/solution.ts` with `start.ts` here. Same agent, same tools, and the loop is gone.

## Memory across turns

The `checkpointer` keeps each conversation's messages for you, per `thread_id`. It's step 2's `messages` list, handled by the framework. You only send the *new* message each turn.

`MemorySaver` keeps it in memory, so it's gone when the program stops. (Step 5d shows memory that survives a restart.)

## Your TODO: write your own tool

A tool is a name, a description, a schema and a function:

```ts
const busTimes = tool(
  async ({ destination }) => {
    return `Next bus from Katubedda to ${destination}: 10:15, 10:40, 11:05`;
  },
  {
    name: "busTimes",
    description: "Bus times from the Katubedda junction. Use when the student asks about buses.",
    schema: z.object({
      destination: z.string().describe("Where they want to go, e.g. 'Colombo Fort'"),
    }),
  },
);
```

Then add it to `tools: [...]` and run `npm run check 4`.

**The description matters most.** It's how the model decides when to use your tool.

### Ideas

- Canteen menu for today
- Bus times from Moratuwa or Katubedda
- GPA calculator (grades and credits in, GPA out)
- Days until an exam or a deadline
- Library opening hours

## Try it

```
You: What do I have tomorrow, and will it rain?
  🔧 getTimetable(day: "tomorrow")
  🔧 getWeather(city: "Moratuwa")
Buddy: ...
You: What about the day after?
```

The second question only works because of the checkpointer.
