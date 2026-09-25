# Step 2: Chatbot

```bash
npm run 2
```

**Chatbot = LLM + state.**

The model still forgets everything between calls. What changed is that *you* keep a `messages` list and send the whole list every time:

```ts
messages.push(new HumanMessage(input));
const reply = await model.invoke(messages); // the WHOLE list, every time
messages.push(reply);
```

Watch the `(sent N messages to the model)` line grow after each turn.

## Try it

```
You: Hi, I'm Nimal from CSE
You: What's my name?
```

Now it knows.

## System prompts

The first message in the list is a `SystemMessage`. It's Campus Buddy's personality and instructions. It's just another message, placed at the top.

## Also new: LangChain

Step 1 used Google's SDK directly. From here on, everything goes through LangChain's model wrapper (`lib/model.ts`), so switching models is one line in `.env`.
