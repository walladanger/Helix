import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseUsage, iterateSse } from "./xai.ts";
import { modelMeta } from "../models.ts";

describe("parseUsage", () => {
  it("should return zeros for undefined raw usage", () => {
    const usage = parseUsage(undefined, "grok-4.5");
    assert.deepEqual(usage, {
      promptTokens: 0,
      completionTokens: 0,
      cachedTokens: 0,
      costUsd: 0,
    });
  });

  it("should parse OpenAI-style tokens", () => {
    const usage = parseUsage(
      {
        prompt_tokens: 100,
        completion_tokens: 50,
      },
      "grok-4.5",
    );
    assert.equal(usage.promptTokens, 100);
    assert.equal(usage.completionTokens, 50);
  });

  it("should fallback to input/output tokens", () => {
    const usage = parseUsage(
      {
        input_tokens: 120,
        output_tokens: 60,
      },
      "grok-4.5",
    );
    assert.equal(usage.promptTokens, 120);
    assert.equal(usage.completionTokens, 60);
  });

  it("should parse cached tokens from prompt_tokens_details", () => {
    const usage = parseUsage(
      {
        prompt_tokens: 100,
        prompt_tokens_details: { cached_tokens: 40 },
      },
      "grok-4.5",
    );
    assert.equal(usage.cachedTokens, 40);
  });

  it("should parse cached tokens from prompt_cache_hit_tokens", () => {
    const usage = parseUsage(
      {
        prompt_tokens: 100,
        prompt_cache_hit_tokens: 30,
      },
      "grok-4.5",
    );
    assert.equal(usage.cachedTokens, 30);
  });

  it("should compute cost from cost_in_usd_ticks", () => {
    const usage = parseUsage(
      {
        cost_in_usd_ticks: 1500000000,
      },
      "grok-4.5",
    );
    assert.equal(usage.costUsd, 0.15);
  });

  it("should compute cost from modelMeta pricing", () => {
    const meta = modelMeta("grok-4.5");
    const usage = parseUsage(
      {
        prompt_tokens: 1000000,
        completion_tokens: 2000000,
        prompt_cache_hit_tokens: 200000,
      },
      "grok-4.5",
    );

    // billedIn = 1000000 - 200000 = 800000
    const expectedCost =
      (800000 / 1e6) * meta.inputPerM +
      (200000 / 1e6) * meta.cachedPerM +
      (2000000 / 1e6) * meta.outputPerM;
    assert.equal(usage.costUsd, expectedCost);
  });

  it("should not allow negative billed input when computing cost", () => {
    const meta = modelMeta("grok-4.5");
    const usage = parseUsage(
      {
        prompt_tokens: 100,
        prompt_cache_hit_tokens: 200,
      },
      "grok-4.5",
    );

    // billedIn = Math.max(0, 100 - 200) = 0
    const expectedCost =
      (0 / 1e6) * meta.inputPerM +
      (200 / 1e6) * meta.cachedPerM +
      (0 / 1e6) * meta.outputPerM;
    assert.equal(usage.costUsd, expectedCost);
  });
});

describe("iterateSse", () => {
  function createSseResponse(chunks: string[]): Response {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      },
    });
    return new Response(stream);
  }

  it("should parse basic SSE chunks", async () => {
    const res = createSseResponse([
      'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":" world"}}]}\n\n',
    ]);
    const events = [];
    for await (const event of iterateSse(res)) {
      events.push(event);
    }
    assert.deepEqual(events, [
      { choices: [{ delta: { content: "Hello" } }] },
      { choices: [{ delta: { content: " world" } }] },
    ]);
  });

  it("should handle multiple events in a single chunk", async () => {
    const res = createSseResponse([
      'data: {"a": 1}\n\ndata: {"b": 2}\n\n',
    ]);
    const events = [];
    for await (const event of iterateSse(res)) {
      events.push(event);
    }
    assert.deepEqual(events, [{ a: 1 }, { b: 2 }]);
  });

  it("should handle events split across chunks", async () => {
    const res = createSseResponse([
      'data: {"c',
      'hoices":',
      ' []}\n\n',
    ]);
    const events = [];
    for await (const event of iterateSse(res)) {
      events.push(event);
    }
    assert.deepEqual(events, [{ choices: [] }]);
  });

  it("should ignore [DONE] and empty payloads", async () => {
    const res = createSseResponse([
      'data: \n\n',
      'data: [DONE]\n\n',
      'data: {"valid": true}\n\n',
    ]);
    const events = [];
    for await (const event of iterateSse(res)) {
      events.push(event);
    }
    assert.deepEqual(events, [{ valid: true }]);
  });

  it("should ignore unparseable JSON (keepalives)", async () => {
    const res = createSseResponse([
      'data: :keepalive\n\n',
      'data: {"valid": true}\n\n',
    ]);
    const events = [];
    for await (const event of iterateSse(res)) {
      events.push(event);
    }
    assert.deepEqual(events, [{ valid: true }]);
  });
});
