import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { appEnvPlugin, APP_ENV_ROUTE } from "./app-env-plugin.mjs";

describe("appEnvPlugin", () => {
  test("plugin properties are correct", () => {
    const plugin = appEnvPlugin();
    assert.equal(APP_ENV_ROUTE, "/__app-env");
    assert.equal(plugin.name, "app-builder:app-env");
    assert.equal(plugin.apply, "serve");
  });

  test("GET /__app-env is served correctly with byte length", () => {
    const plugin = appEnvPlugin();
    let capturedMiddleware;
    const fakeServer = {
      config: {
        env: { NON_ASCII: "こんにちは" }, // Non-ASCII value to verify byte length
      },
      middlewares: {
        use(fn) {
          capturedMiddleware = fn;
        },
      },
    };

    plugin.configureServer(fakeServer);
    assert.ok(capturedMiddleware);

    let nextCalled = false;
    const req = {
      url: "/__app-env",
      method: "GET",
    };

    let responseData = "";
    const res = {
      headers: {},
      statusCode: null,
      setHeader(name, value) {
        this.headers[name.toLowerCase()] = value;
      },
      end(data) {
        responseData = data.toString("utf8");
      },
    };

    capturedMiddleware(
      req,
      res,
      () => {
        nextCalled = true;
      }
    );

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 200);
    assert.equal(res.headers["content-type"], "application/json; charset=utf-8");
    assert.equal(res.headers["cache-control"], "no-cache");

    const expectedBody = Buffer.from(JSON.stringify(fakeServer.config.env), "utf8");
    assert.equal(res.headers["content-length"], String(expectedBody.byteLength));
    assert.notEqual(res.headers["content-length"], String(JSON.stringify(fakeServer.config.env).length));

    assert.deepEqual(JSON.parse(responseData), fakeServer.config.env);
  });

  test("Query string is ignored", () => {
    const plugin = appEnvPlugin();
    let capturedMiddleware;
    const fakeServer = {
      config: { env: { test: 1 } },
      middlewares: { use(fn) { capturedMiddleware = fn; } },
    };
    plugin.configureServer(fakeServer);

    let nextCalled = false;
    let ended = false;
    const req = { url: "/__app-env?x=1", method: "GET" };
    const res = {
      setHeader() {},
      end() { ended = true; },
    };

    capturedMiddleware(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 200);
    assert.equal(ended, true);
  });

  test("Method missing (req.method undefined) is treated as GET and served", () => {
    const plugin = appEnvPlugin();
    let capturedMiddleware;
    const fakeServer = {
      config: { env: { test: 1 } },
      middlewares: { use(fn) { capturedMiddleware = fn; } },
    };
    plugin.configureServer(fakeServer);

    let nextCalled = false;
    let ended = false;
    const req = { url: "/__app-env" }; // Method undefined
    const res = {
      setHeader() {},
      end() { ended = true; },
    };

    capturedMiddleware(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 200);
    assert.equal(ended, true);
  });

  test("Lowercase 'get' method is served", () => {
    const plugin = appEnvPlugin();
    let capturedMiddleware;
    const fakeServer = {
      config: { env: { test: 1 } },
      middlewares: { use(fn) { capturedMiddleware = fn; } },
    };
    plugin.configureServer(fakeServer);

    let nextCalled = false;
    let ended = false;
    const req = { url: "/__app-env", method: "get" };
    const res = {
      setHeader() {},
      end() { ended = true; },
    };

    capturedMiddleware(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 200);
    assert.equal(ended, true);
  });

  test("POST /__app-env calls next() exactly once and never calls res.end", () => {
    const plugin = appEnvPlugin();
    let capturedMiddleware;
    const fakeServer = {
      config: { env: { test: 1 } },
      middlewares: { use(fn) { capturedMiddleware = fn; } },
    };
    plugin.configureServer(fakeServer);

    let nextCalls = 0;
    let ended = false;
    const req = { url: "/__app-env", method: "POST" };
    const res = {
      setHeader() {},
      end() { ended = true; },
    };

    capturedMiddleware(req, res, () => { nextCalls++; });

    assert.equal(nextCalls, 1);
    assert.equal(ended, false);
  });

  test("Different path calls next() exactly once and never calls res.end", () => {
    const plugin = appEnvPlugin();
    let capturedMiddleware;
    const fakeServer = {
      config: { env: { test: 1 } },
      middlewares: { use(fn) { capturedMiddleware = fn; } },
    };
    plugin.configureServer(fakeServer);

    const checkNextAndEnd = (req) => {
        let nextCalls = 0;
        let ended = false;
        const res = {
            setHeader() {},
            end() { ended = true; },
        };
        capturedMiddleware(req, res, () => { nextCalls++; });
        assert.equal(nextCalls, 1);
        assert.equal(ended, false);
    };

    checkNextAndEnd({ url: "/__app-env/extra", method: "GET" });
    checkNextAndEnd({ url: "/other", method: "GET" });
  });

  test("req.url undefined calls next() exactly once and never calls res.end", () => {
    const plugin = appEnvPlugin();
    let capturedMiddleware;
    const fakeServer = {
      config: { env: { test: 1 } },
      middlewares: { use(fn) { capturedMiddleware = fn; } },
    };
    plugin.configureServer(fakeServer);

    let nextCalls = 0;
    let ended = false;
    const req = { method: "GET" }; // url undefined
    const res = {
      setHeader() {},
      end() { ended = true; },
    };

    capturedMiddleware(req, res, () => { nextCalls++; });

    assert.equal(nextCalls, 1);
    assert.equal(ended, false);
  });
});
