import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Workaround for missing module resolution (`zod` and `./app-data/types`) in the minimal
// strip-types environment. Extract and transpile the pure functions dynamically.
import { transpile, ModuleKind, ScriptTarget } from "typescript";
import * as fs from "node:fs";
import * as path from "node:path";
import * as url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const sourcePath = path.join(__dirname, "preview-host-bridge.ts");
const sourceCode = fs.readFileSync(sourcePath, "utf-8");

const isSafeBridgePathCode = sourceCode.match(/export function isSafeBridgePath[\s\S]*?\n\}/)?.[0].replace("export ", "");
const collectRoutePathsFromTreeCode = sourceCode.match(/export function collectRoutePathsFromTree[\s\S]*?\n\}/)?.[0].replace("export ", "");

const tsOptions = { compilerOptions: { module: ModuleKind.CommonJS, target: ScriptTarget.ES2022 } };
const jsIsSafeBridgePath = transpile(isSafeBridgePathCode || "", tsOptions.compilerOptions);
const jsCollectRoutePathsFromTree = transpile(collectRoutePathsFromTreeCode || "", tsOptions.compilerOptions);

const evalContext = new Function(`
  const exports = {};
  ${jsIsSafeBridgePath}
  ${jsCollectRoutePathsFromTree}
  return { isSafeBridgePath, collectRoutePathsFromTree };
`);
const { isSafeBridgePath, collectRoutePathsFromTree } = evalContext();

describe("isSafeBridgePath", () => {
  it("accepts valid relative app paths", () => {
    assert.equal(isSafeBridgePath("/"), true);
    assert.equal(isSafeBridgePath("/foo/bar"), true);
    assert.equal(isSafeBridgePath("/a/b?c=d#e"), true);
    assert.equal(isSafeBridgePath("/../"), true);
    assert.equal(isSafeBridgePath("/../../traversal"), true);
  });

  it("rejects non-relative, absolute, or malformed paths", () => {
    assert.equal(isSafeBridgePath(""), false);
    assert.equal(isSafeBridgePath("https://example.com"), false);
    assert.equal(isSafeBridgePath("http://example.com"), false);
    assert.equal(isSafeBridgePath("//example.com"), false);
    assert.equal(isSafeBridgePath("javascript:alert(1)"), false);
    assert.equal(isSafeBridgePath("data:text/html,test"), false);
    assert.equal(isSafeBridgePath("/\\foo"), false);
    assert.equal(isSafeBridgePath("\\foo"), false);
    assert.equal(isSafeBridgePath("foo/bar"), false);
  });
});

describe("collectRoutePathsFromTree", () => {
  it("handles null, undefined, and non-objects", () => {
    assert.deepEqual(collectRoutePathsFromTree(null), []);
    assert.deepEqual(collectRoutePathsFromTree(undefined), []);
    assert.deepEqual(collectRoutePathsFromTree("string"), []);
    assert.deepEqual(collectRoutePathsFromTree(123), []);
    assert.deepEqual(collectRoutePathsFromTree(true), []);
  });

  it("collects from a single route node", () => {
    assert.deepEqual(collectRoutePathsFromTree({ fullPath: "/a" }), ["/a"]);
    assert.deepEqual(collectRoutePathsFromTree({ path: "/b" }), ["/b"]);
    assert.deepEqual(collectRoutePathsFromTree({ fullPath: "c" }), ["/c"]);
    assert.deepEqual(collectRoutePathsFromTree({ path: "d" }), ["/d"]);
    assert.deepEqual(collectRoutePathsFromTree({ fullPath: "" }), ["/"]);
    assert.deepEqual(collectRoutePathsFromTree({ path: "" }), ["/"]);
  });

  it("prioritizes fullPath over path", () => {
    assert.deepEqual(
      collectRoutePathsFromTree({ fullPath: "/full", path: "/partial" }),
      ["/full"],
    );
  });

  it("collects nested routes from children array", () => {
    const tree = {
      path: "",
      children: [
        { fullPath: "/a" },
        { path: "/b", children: [{ fullPath: "/b/c" }] },
      ],
    };
    assert.deepEqual(collectRoutePathsFromTree(tree), ["/", "/a", "/b", "/b/c"]);
  });

  it("collects nested routes from children object", () => {
    const tree = {
      path: "",
      children: {
        route1: { fullPath: "/a" },
        route2: { path: "/b", children: { route3: { fullPath: "/b/c" } } },
      },
    };
    assert.deepEqual(collectRoutePathsFromTree(tree), ["/", "/a", "/b", "/b/c"]);
  });

  it("deduplicates paths", () => {
    const tree = {
      children: [
        { fullPath: "/a" },
        { path: "/a" },
        { fullPath: "a" },
      ],
    };
    assert.deepEqual(collectRoutePathsFromTree(tree), ["/a"]);
  });
});
