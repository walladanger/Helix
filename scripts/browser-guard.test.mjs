import assert from "node:assert/strict";
import { test, beforeEach, afterEach } from "node:test";
import { resolve, sep } from "node:path";
import { checkedUrl, checkedOutputPath } from "./browser-guard.mjs";

let originalProcessExit;
let originalConsoleError;
let errors = [];

beforeEach(() => {
  originalProcessExit = process.exit;
  originalConsoleError = console.error;

  errors = [];

  process.exit = (code) => {
    throw new Error(`process.exit(${code}) called`);
  };

  console.error = (...args) => {
    // Collect error messages. The `fail` function logs a JSON string.
    try {
      errors.push(JSON.parse(args[0]));
    } catch {
      errors.push(args[0]);
    }
  };
});

afterEach(() => {
  process.exit = originalProcessExit;
  console.error = originalConsoleError;
  delete process.env.BROWSER_ALLOW_EXTERNAL_HOST;
});

// Helper to catch exits and assert error message matches
function assertFails(fn, expectedErrorPattern) {
  errors = [];
  try {
    fn();
    assert.fail("Expected function to exit, but it succeeded");
  } catch (err) {
    assert.match(err.message, /process.exit\(1\) called/);
    assert.equal(errors.length, 1);
    assert.equal(errors[0].ok, false);
    assert.match(errors[0].error, expectedErrorPattern);
  }
}

test("checkedUrl accepts http/https loopback hosts", () => {
  assert.equal(checkedUrl("http://127.0.0.1/path"), "http://127.0.0.1/path");
  assert.equal(checkedUrl("https://localhost:8080/"), "https://localhost:8080/");
  assert.equal(checkedUrl("http://[::1]/"), "http://[::1]/");
});

test("checkedUrl rejects other protocols", () => {
  assertFails(() => checkedUrl("file:///etc/passwd"), /only http\/https URLs are allowed, got file:/);
  assertFails(() => checkedUrl("data:text/plain,hello"), /only http\/https URLs are allowed, got data:/);
  assertFails(() => checkedUrl("javascript:alert(1)"), /only http\/https URLs are allowed, got javascript:/);
  assertFails(() => checkedUrl("chrome://settings"), /only http\/https URLs are allowed, got chrome:/);
  assertFails(() => checkedUrl("view-source:http://localhost"), /only http\/https URLs are allowed, got view-source:/);
});

test("checkedUrl rejects invalid URLs", () => {
  assertFails(() => checkedUrl("not-a-url"), /not a valid URL: not-a-url/);
});

test("checkedUrl rejects external hosts unless BROWSER_ALLOW_EXTERNAL_HOST=1", () => {
  assertFails(() => checkedUrl("http://example.com"), /example.com is not a loopback host/);

  process.env.BROWSER_ALLOW_EXTERNAL_HOST = "1";
  assert.equal(checkedUrl("http://example.com"), "http://example.com");
});

test("checkedOutputPath accepts path inside an allowed dir", () => {
  const allowed = [resolve("/workspace")];
  const target = resolve("/workspace/file.png");
  assert.equal(checkedOutputPath(target, allowed), target);
});

test("checkedOutputPath rejects the allowed dir itself", () => {
  const allowed = [resolve("/workspace")];
  const target = resolve("/workspace");
  assertFails(() => checkedOutputPath(target, allowed), /screenshot path must be under/);
});

test("checkedOutputPath rejects a sibling with the same prefix", () => {
  const allowed = [resolve("/workspace")];
  const target = resolve("/workspace2/x");
  assertFails(() => checkedOutputPath(target, allowed), /screenshot path must be under/);
});

test("checkedOutputPath rejects .. traversal", () => {
  const allowed = [resolve("/workspace")];
  const target = resolve("/workspace/../etc/x");
  assertFails(() => checkedOutputPath(target, allowed), /screenshot path must be under/);
});

test("checkedOutputPath handles allowed dir with a trailing separator", () => {
  const allowed = [resolve("/workspace") + sep];
  const target = resolve("/workspace/file.png");
  assert.equal(checkedOutputPath(target, allowed), target);
});

test("checkedOutputPath handles multiple allowed dirs", () => {
  const allowed = [resolve("/workspace1"), resolve("/workspace2")];

  // Accept from either
  const target1 = resolve("/workspace1/file1.png");
  const target2 = resolve("/workspace2/file2.png");
  assert.equal(checkedOutputPath(target1, allowed), target1);
  assert.equal(checkedOutputPath(target2, allowed), target2);

  // Reject from neither
  const target3 = resolve("/workspace3/file3.png");
  assertFails(() => checkedOutputPath(target3, allowed), /screenshot path must be under .*workspace1.* or .*workspace2/);
});

test("checkedOutputPath includes custom label in the error message", () => {
  const allowed = [resolve("/workspace")];
  const target = resolve("/etc/passwd");
  assertFails(() => checkedOutputPath(target, allowed, "custom-label"), /custom-label path must be under/);
});
