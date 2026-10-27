import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  GATE_SESSION_MARKER_COOKIE,
  hasGateSessionMarker,
} from "./gate-session-marker.ts";

describe("hasGateSessionMarker", () => {
  afterEach(() => {
    // @ts-expect-error - stubbing global for testing
    delete globalThis.document;
  });

  it("returns false when globalThis.document is undefined", () => {
    assert.equal(hasGateSessionMarker(), false);
  });

  it("returns true when document.cookie contains the marker cookie", () => {
    const cases = [
      "__Host-grok_gate_session=1", // alone
      "__Host-grok_gate_session=1; other=2", // first, with space
      "__Host-grok_gate_session=1;other=2", // first, without space
      "other=2; __Host-grok_gate_session=1; another=3", // middle, with spaces
      "other=2;__Host-grok_gate_session=1;another=3", // middle, without spaces
      "other=2; __Host-grok_gate_session=1", // last, with space
      "other=2;__Host-grok_gate_session=1", // last, without space
    ];

    for (const cookieString of cases) {
      // @ts-expect-error - stubbing global for testing
      globalThis.document = { cookie: cookieString };
      assert.equal(
        hasGateSessionMarker(),
        true,
        `Expected true for cookie: "${cookieString}"`
      );
    }
  });

  it("returns false when the marker cookie is absent or only similarly named cookies exist", () => {
    const cases = [
      "", // absent
      "other=1; another=2", // absent
      "x__Host-grok_gate_session=1", // prefix
      "__Host-grok_gate_session_old=1", // suffix
      "other=__Host-grok_gate_session=1", // inside value
      "other=2; x__Host-grok_gate_session=1; another=3", // middle prefix
      "other=2; __Host-grok_gate_session_old=1; another=3", // middle suffix
    ];

    for (const cookieString of cases) {
      // @ts-expect-error - stubbing global for testing
      globalThis.document = { cookie: cookieString };
      assert.equal(
        hasGateSessionMarker(),
        false,
        `Expected false for cookie: "${cookieString}"`
      );
    }
  });
});

describe("GATE_SESSION_MARKER_COOKIE", () => {
  it('equals "__Host-grok_gate_session"', () => {
    assert.equal(GATE_SESSION_MARKER_COOKIE, "__Host-grok_gate_session");
  });
});
