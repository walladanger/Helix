import { strict as assert } from "node:assert";
import test from "node:test";
import { runProviderChat } from "../src/lib/runtimes/provider-chat.ts";

test("OpenAI connector routes to its fixed API and does not store a response", async () => {
  let seen;
  const result = await runProviderChat({
    provider: "openai", key: "test-key", model: "example", prompt: "hello", maxOutputTokens: 32,
    request: async (url, init) => {
      seen = { url, init };
      return Response.json({ output: [{ content: [{ type: "output_text", text: "Hi" }] }], usage: { input_tokens: 2, output_tokens: 1 } });
    },
  });
  assert.equal(seen.url, "https://api.openai.com/v1/responses");
  assert.equal(JSON.parse(seen.init.body).store, false);
  assert.equal(result.text, "Hi");
  assert.equal(result.costUsd, null);
});

test("Anthropic connector uses its own messages protocol without leaking keys in errors", async () => {
  let seen;
  const result = await runProviderChat({
    provider: "anthropic", key: "private-key", model: "example", prompt: "hello", maxOutputTokens: 16,
    request: async (url, init) => {
      seen = { url, init };
      return Response.json({ content: [{ type: "text", text: "Hello" }], usage: { input_tokens: 3, output_tokens: 1 } });
    },
  });
  assert.equal(seen.url, "https://api.anthropic.com/v1/messages");
  assert.equal(seen.init.headers["x-api-key"], "private-key");
  assert.equal(result.text, "Hello");
  assert.equal(result.inputTokens, 3);
  await assert.rejects(runProviderChat({
    provider: "anthropic", key: "private-key", model: "example", prompt: "hello", maxOutputTokens: 16,
    request: async () => new Response("private-key", { status: 401 }),
  }), (error) => !error.message.includes("private-key"));
});
