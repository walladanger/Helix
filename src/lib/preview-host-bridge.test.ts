import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isSafeBridgePath,
  collectRoutePathsFromTree,
} from "./preview-host-bridge.ts";

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
    assert.equal(isSafeBridgePath("foo/bar"), false); // Doesn't start with /
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
