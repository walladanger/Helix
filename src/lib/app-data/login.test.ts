import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  isLoginRequired,
  isConnectorPending,
  isFramed,
  redirectToLoginIfRequired,
} from "./login.ts";
import type { CallToolResult } from "./types.ts";

describe("isLoginRequired", () => {
  it("returns false if ok is true", () => {
    assert.equal(isLoginRequired({ ok: true } as CallToolResult), false);
    assert.equal(
      isLoginRequired({ ok: true, loginRequired: true } as CallToolResult),
      false,
    );
  });

  it("returns false if ok is false but loginRequired is not true", () => {
    assert.equal(isLoginRequired({ ok: false } as CallToolResult), false);
    assert.equal(
      isLoginRequired({ ok: false, loginRequired: false } as CallToolResult),
      false,
    );
    // @ts-expect-error - testing invalid type
    assert.equal(isLoginRequired({ ok: false, loginRequired: "yes" }), false);
  });

  it("returns true if ok is false and loginRequired is true", () => {
    assert.equal(
      isLoginRequired({ ok: false, loginRequired: true } as CallToolResult),
      true,
    );
  });
});

describe("isConnectorPending", () => {
  it("returns false if ok is true", () => {
    assert.equal(isConnectorPending({ ok: true } as CallToolResult), false);
    assert.equal(
      isConnectorPending({ ok: true, pending: true } as CallToolResult),
      false,
    );
  });

  it("returns false if ok is false but pending is not true", () => {
    assert.equal(isConnectorPending({ ok: false } as CallToolResult), false);
    assert.equal(
      isConnectorPending({ ok: false, pending: false } as CallToolResult),
      false,
    );
    // @ts-expect-error - testing invalid type
    assert.equal(isConnectorPending({ ok: false, pending: "yes" }), false);
  });

  it("returns true if ok is false and pending is true", () => {
    assert.equal(
      isConnectorPending({ ok: false, pending: true } as CallToolResult),
      true,
    );
  });
});

describe("isFramed", () => {
  const originalWindowDesc = Object.getOwnPropertyDescriptor(globalThis, "window");

  afterEach(() => {
    if (originalWindowDesc) {
      Object.defineProperty(globalThis, "window", originalWindowDesc);
    } else {
      // @ts-expect-error - restoring globalThis
      delete globalThis.window;
    }
  });

  it("returns false when self === top", () => {
    const fakeWindow = {
      get self() {
        return this;
      },
      get top() {
        return this;
      },
    };
    Object.defineProperty(globalThis, "window", {
      value: fakeWindow,
      configurable: true,
    });
    assert.equal(isFramed(), false);
  });

  it("returns true when self !== top", () => {
    const fakeWindow = {
      get self() {
        return this;
      },
      get top() {
        return {}; // different object
      },
    };
    Object.defineProperty(globalThis, "window", {
      value: fakeWindow,
      configurable: true,
    });
    assert.equal(isFramed(), true);
  });

  it("returns true when accessing top throws", () => {
    const fakeWindow = {
      get self() {
        return this;
      },
      get top() {
        throw new Error("Access denied");
      },
    };
    Object.defineProperty(globalThis, "window", {
      value: fakeWindow,
      configurable: true,
    });
    assert.equal(isFramed(), true);
  });
});

describe("redirectToLoginIfRequired", () => {
  const originalWindowDesc = Object.getOwnPropertyDescriptor(globalThis, "window");

  afterEach(() => {
    if (originalWindowDesc) {
      Object.defineProperty(globalThis, "window", originalWindowDesc);
    } else {
      // @ts-expect-error - restoring globalThis
      delete globalThis.window;
    }
  });

  it("returns false when login isn't required", () => {
    assert.equal(
      redirectToLoginIfRequired({ ok: false, loginRequired: false } as CallToolResult),
      false,
    );
    assert.equal(
      redirectToLoginIfRequired({ ok: true, loginRequired: true } as CallToolResult),
      false,
    );
  });

  it("returns false when loginUrl is missing", () => {
    assert.equal(
      redirectToLoginIfRequired({ ok: false, loginRequired: true } as CallToolResult),
      false,
    );
    assert.equal(
      redirectToLoginIfRequired({
        ok: false,
        loginRequired: true,
        loginUrl: "",
      } as CallToolResult),
      false,
    );
  });

  it("returns false when window is undefined", () => {
    // Ensure window is undefined
    if (originalWindowDesc) {
      // @ts-expect-error - manipulating globals
      delete globalThis.window;
    }
    assert.equal(
      redirectToLoginIfRequired({
        ok: false,
        loginRequired: true,
        loginUrl: "https://example.com/login",
      } as CallToolResult),
      false,
    );
  });

  it("calls window.location.assign and returns true when not framed", () => {
    let assignedUrl: string | undefined;
    const fakeWindow = {
      get self() {
        return this;
      },
      get top() {
        return this;
      },
      location: {
        assign(url: string) {
          assignedUrl = url;
        },
      },
      open() {
        assert.fail("Should not call window.open");
      },
    };
    Object.defineProperty(globalThis, "window", {
      value: fakeWindow,
      configurable: true,
    });

    assert.equal(
      redirectToLoginIfRequired({
        ok: false,
        loginRequired: true,
        loginUrl: "https://example.com/login",
      } as CallToolResult),
      true,
    );
    assert.equal(assignedUrl, "https://example.com/login");
  });

  it("calls window.open, clears opener, and returns true when framed", () => {
    let openedUrl: string | undefined;
    let openedTarget: string | undefined;
    let assignedUrl: string | undefined;

    const fakeOpenerWindow: any = { opener: {} };

    const fakeWindow = {
      get self() {
        return this;
      },
      get top() {
        return {}; // Framed
      },
      location: {
        assign(url: string) {
          assignedUrl = url;
        },
      },
      open(url: string, target: string) {
        openedUrl = url;
        openedTarget = target;
        return fakeOpenerWindow;
      },
    };
    Object.defineProperty(globalThis, "window", {
      value: fakeWindow,
      configurable: true,
    });

    assert.equal(
      redirectToLoginIfRequired({
        ok: false,
        loginRequired: true,
        loginUrl: "https://example.com/login",
      } as CallToolResult),
      true,
    );
    assert.equal(openedUrl, "https://example.com/login");
    assert.equal(openedTarget, "_blank");
    assert.equal(fakeOpenerWindow.opener, null);
    assert.equal(assignedUrl, undefined);
  });

  it("falls back to window.location.assign if window.open returns null when framed", () => {
    let openedUrl: string | undefined;
    let assignedUrl: string | undefined;

    const fakeWindow = {
      get self() {
        return this;
      },
      get top() {
        return {}; // Framed
      },
      location: {
        assign(url: string) {
          assignedUrl = url;
        },
      },
      open(url: string) {
        openedUrl = url;
        return null; // Simulate blocked popup
      },
    };
    Object.defineProperty(globalThis, "window", {
      value: fakeWindow,
      configurable: true,
    });

    assert.equal(
      redirectToLoginIfRequired({
        ok: false,
        loginRequired: true,
        loginUrl: "https://example.com/login",
      } as CallToolResult),
      true,
    );
    assert.equal(openedUrl, "https://example.com/login");
    assert.equal(assignedUrl, "https://example.com/login");
  });
});
