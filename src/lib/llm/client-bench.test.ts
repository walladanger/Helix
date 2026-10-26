import { describe, test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { runBench } from "./client-bench.ts";


describe("runBench", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  function createSSEStream(chunks: string[]) {
    let i = 0;
    return new ReadableStream({
      pull(controller) {
        if (i < chunks.length) {
          controller.enqueue(new TextEncoder().encode(chunks[i++]));
        } else {
          controller.close();
        }
      },
    });
  }

  test("handles successful start/token/done events with metrics", async () => {
    let requestBody: any;
    globalThis.fetch = async (input, init) => {
      if (init?.body) requestBody = JSON.parse(init.body as string);
      return {
        ok: true,
        body: createSSEStream([
          'data: {"type":"start","model":"grok-4.5"}\n\n',
          'data: {"type":"token","text":"hello"}\n\n',
          'data: {"type":"token","text":" world"}\n\n',
          'data: {"type":"done","metrics":{"model":"grok-4.5","promptChars":10,"outputText":"hello world","ttftMs":100,"tpotMs":50,"outputTps":20,"promptTps":100,"totalMs":150,"promptTokens":5,"completionTokens":2,"cachedTokens":0,"cacheHitPct":0,"costUsd":0.001,"entropyBpc":null}}\n\n',
        ]),
      } as unknown as Response;
    };

    const tokens: string[] = [];
    let startModel = "";

    const metrics = await runBench({
      prompt: "test prompt",
      model: "grok-4.5",
      live: {
        onToken: (t) => tokens.push(t),
        onStart: (m) => {
          startModel = m;
        },
      },
    });

    assert.strictEqual(requestBody.prompt, "test prompt");
    assert.strictEqual(requestBody.model, "grok-4.5");
    assert.strictEqual(requestBody.maxTokens, 96);

    assert.strictEqual(startModel, "grok-4.5");
    assert.deepStrictEqual(tokens, ["hello", " world"]);

    assert.strictEqual(metrics.model, "grok-4.5");
    assert.strictEqual(metrics.promptChars, 10);
    assert.strictEqual(metrics.outputText, "hello world");
    assert.ok(typeof metrics.id === "string" && metrics.id.length > 0);
    assert.ok(typeof metrics.at === "number" && metrics.at > 0);
  });

  test("handles events split across chunk boundaries", async () => {
    globalThis.fetch = async () => {
      return {
        ok: true,
        body: createSSEStream([
          'data: {"type":"start","m',
          'odel":"grok-4.5"}\n\n',
          'data: {"type":"done","metrics":{"model":"grok-4.5","promptChars":10,"outputText":"","ttftMs":100,"tpotMs":50,"outputTps":20,"promptTps":100,"totalMs":150,"promptTokens":5,"completionTokens":2,"cachedTokens":0,"cacheHitPct":0,"costUsd":0.001,"entropyBpc":null}}\n\n',
        ]),
      } as unknown as Response;
    };

    let startModel = "";
    await runBench({
      prompt: "test",
      model: "grok-4.5",
      live: {
        onToken: () => {},
        onStart: (m) => {
          startModel = m;
        },
      },
    });

    assert.strictEqual(startModel, "grok-4.5");
  });

  test("throws on non-OK response with JSON error", async () => {
    globalThis.fetch = async () => {
      return {
        ok: false,
        status: 400,
        json: async () => ({ error: "Bad Request" }),
      } as unknown as Response;
    };

    await assert.rejects(
      runBench({ prompt: "test", model: "grok-4.5" }),
      (err: Error) => err.message === "Bad Request"
    );
  });

  test("throws on non-OK response with non-JSON body", async () => {
    globalThis.fetch = async () => {
      return {
        ok: false,
        status: 500,
        json: async () => {
          throw new Error("Invalid JSON");
        },
      } as unknown as Response;
    };

    await assert.rejects(
      runBench({ prompt: "test", model: "grok-4.5" }),
      (err: Error) => err.message === "HTTP 500"
    );
  });

  test("throws when body is missing", async () => {
    globalThis.fetch = async () => {
      return {
        ok: true,
        body: null,
      } as unknown as Response;
    };

    await assert.rejects(
      runBench({ prompt: "test", model: "grok-4.5" }),
      (err: Error) => err.message === "No stream"
    );
  });

  test("throws on error event in stream", async () => {
    globalThis.fetch = async () => {
      return {
        ok: true,
        body: createSSEStream([
          'data: {"type":"error","error":"Stream failed"}\n\n',
        ]),
      } as unknown as Response;
    };

    await assert.rejects(
      runBench({ prompt: "test", model: "grok-4.5" }),
      (err: Error) => err.message === "Stream failed"
    );
  });

  test("throws when stream ends without done event", async () => {
    globalThis.fetch = async () => {
      return {
        ok: true,
        body: createSSEStream([
          'data: {"type":"start","model":"grok-4.5"}\n\n',
        ]),
      } as unknown as Response;
    };

    await assert.rejects(
      runBench({ prompt: "test", model: "grok-4.5" }),
      (err: Error) => err.message === "Incomplete bench stream"
    );
  });

  test("defaults maxTokens to 96 when not provided", async () => {
    let requestBody: any;
    globalThis.fetch = async (input, init) => {
      if (init?.body) requestBody = JSON.parse(init.body as string);
      return {
        ok: true,
        body: createSSEStream([
          'data: {"type":"done","metrics":{"model":"grok-4.5","promptChars":10,"outputText":"","ttftMs":100,"tpotMs":50,"outputTps":20,"promptTps":100,"totalMs":150,"promptTokens":5,"completionTokens":2,"cachedTokens":0,"cacheHitPct":0,"costUsd":0.001,"entropyBpc":null}}\n\n',
        ]),
      } as unknown as Response;
    };

    await runBench({ prompt: "test", model: "grok-4.5" });

    assert.strictEqual(requestBody.maxTokens, 96);
  });

  test("passes maxTokens when provided", async () => {
    let requestBody: any;
    globalThis.fetch = async (input, init) => {
      if (init?.body) requestBody = JSON.parse(init.body as string);
      return {
        ok: true,
        body: createSSEStream([
          'data: {"type":"done","metrics":{"model":"grok-4.5","promptChars":10,"outputText":"","ttftMs":100,"tpotMs":50,"outputTps":20,"promptTps":100,"totalMs":150,"promptTokens":5,"completionTokens":2,"cachedTokens":0,"cacheHitPct":0,"costUsd":0.001,"entropyBpc":null}}\n\n',
        ]),
      } as unknown as Response;
    };

    await runBench({ prompt: "test", model: "grok-4.5", maxTokens: 42 });

    assert.strictEqual(requestBody.maxTokens, 42);
  });
});
