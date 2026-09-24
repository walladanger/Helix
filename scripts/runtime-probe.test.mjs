import { strict as assert } from "node:assert";
import test from "node:test";
import { probeLocalRuntime } from "../src/lib/runtimes/local-probe.ts";

test("local probes use fixed numeric loopback, never infer model from GPU use", async () => {
  const requests = [];
  const result = await probeLocalRuntime("lm-studio", async (url, options) => {
    requests.push({ url, options });
    return Response.json({ data: [{ id: "local-model", loaded_instances: [] }] });
  });
  assert.deepEqual(result.models, ["local-model"]);
  assert.equal(result.status, "available");
  assert.equal(requests[0].url, "http://127.0.0.1:1234/api/v1/models");
  assert.equal(requests[0].options.redirect, "error");
});

test("auth and absent local servers stay distinct", async () => {
  assert.equal((await probeLocalRuntime("llama-cpp", async () => new Response(null, { status: 401 }))).status, "unauthorized");
  assert.equal((await probeLocalRuntime("llama-cpp", async () => { throw new Error("offline"); })).status, "unavailable");
});
