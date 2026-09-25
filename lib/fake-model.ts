// Scripted models used by `npm run check`. No key, no network, same answers every time.
// You don't need to read this file to do the workshop.
import { AIMessage, fakeModel, type BaseMessage, type ToolMessage } from "langchain";
import { writeSync } from "node:fs";
import { z } from "zod";

/** Sends a line to scripts/check.ts over stderr. */
function report(data: object) {
  writeSync(2, `__CHECK__ ${JSON.stringify(data)}\n`);
}

const lastToolMessage = (messages: BaseMessage[]) =>
  messages.findLast((m) => m.type === "tool") as ToolMessage | undefined;

export function fakeModelFor(step: string) {
  if (step === "3") return step3();
  if (step === "4") return step4();
  throw new Error(`There is no scripted model for step ${step}.`);
}

// Step 3: ask for getWeather once, then answer using whatever the tool returned.
function step3() {
  const model = fakeModel()
    .respondWithTools([{ name: "getWeather", args: { city: "Moratuwa" }, id: "call_weather_1" }])
    .respond((messages) => {
      const toolMsg = lastToolMessage(messages);
      if (!toolMsg) {
        report({ problem: "no_tool_message" });
        return new AIMessage("I asked for the weather but never got an answer.");
      }
      if (toolMsg.tool_call_id !== "call_weather_1") {
        report({ problem: "wrong_tool_call_id", got: toolMsg.tool_call_id });
      }
      const askedAt = messages.findIndex(
        (m) => m.type === "ai" && (m as AIMessage).tool_calls?.some((c) => c.id === "call_weather_1"),
      );
      if (askedAt === -1 || askedAt > messages.indexOf(toolMsg)) {
        report({ problem: "missing_ai_message" });
      }
      return new AIMessage(`Here's what I found: ${toolMsg.content}`);
    });
  process.on("exit", () => report({ calls: model.callCount }));
  return model;
}

// Step 4: find the student's own tool, call it with sample arguments, report what happened.
const BUILT_IN = new Set(["getWeather", "getTimetable"]);

function step4() {
  let custom: { name: string; jsonSchema: any } | undefined;
  let reported = false;

  const model = fakeModel()
    .respond(() => {
      if (!custom) return new AIMessage("Hi! (no custom tool found)");
      return new AIMessage({
        content: "",
        tool_calls: [{ name: custom.name, args: sampleArgs(custom.jsonSchema), id: "call_custom_1", type: "tool_call" }],
      });
    })
    .respond((messages) => {
      const toolMsg = lastToolMessage(messages);
      report({
        toolRan: true,
        status: toolMsg?.status ?? "success",
        result: String(toolMsg?.content ?? "").slice(0, 200),
      });
      return new AIMessage("Thanks, that worked!");
    });

  const bindTools = model.bindTools.bind(model);
  model.bindTools = (tools: any[]) => {
    const info = tools.map((t) => ({
      name: t.name,
      description: t.description ?? "",
      jsonSchema: toJsonSchema(t.schema),
    }));
    custom = info.find((t) => !BUILT_IN.has(t.name));
    if (!reported) {
      reported = true;
      report({ tools: info.map(({ name, description, jsonSchema }) => ({ name, description, hasSchema: !!jsonSchema })) });
    }
    return bindTools(tools);
  };
  return model;
}

function toJsonSchema(schema: unknown): any {
  if (!schema || typeof schema !== "object") return undefined;
  if ("_zod" in schema) return z.toJSONSchema(schema as z.ZodType);
  return schema; // already a JSON schema
}

/** Builds plausible arguments from a JSON schema, e.g. { city: "test", days: 1 }. */
function sampleArgs(schema: any): any {
  if (!schema) return {};
  if (schema.default !== undefined) return schema.default;
  if (schema.const !== undefined) return schema.const;
  if (schema.enum) return schema.enum[0];
  if (schema.anyOf) return sampleArgs(schema.anyOf[0]);
  const type = Array.isArray(schema.type) ? schema.type[0] : schema.type;
  switch (type) {
    case "string": return "test";
    case "number":
    case "integer": return schema.minimum ?? 1;
    case "boolean": return true;
    case "array": return [sampleArgs(schema.items)];
    case "object":
      return Object.fromEntries(Object.entries(schema.properties ?? {}).map(([k, v]) => [k, sampleArgs(v)]));
    default: return null;
  }
}
