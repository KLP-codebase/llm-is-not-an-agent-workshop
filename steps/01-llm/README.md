# Step 1: LLM

```bash
npm run 1
```

An LLM is a function: **text in, text out**. It predicts the next words. It has no memory, no internet and no hands.

`index.ts` is the whole thing: one `generateContent` call per message. Nothing is carried over from one call to the next.

## Try it

```
You: Hi, I'm Nimal from CSE
You: What's my name?
```

It has no idea. And ask it "What's the weather in Moratuwa right now?". It can guess, but it can't check.

## The point

The model isn't broken. Every call starts from nothing because *there is nothing else*. Anything that looks like memory or action has to come from code around the model. That code is what the rest of this repo builds.
