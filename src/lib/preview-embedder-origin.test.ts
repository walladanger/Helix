import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isGrokEmbedderOrigin,
  isSandboxPreviewGuestHost,
  resolveParentEmbedderOrigin,
} from "./preview-embedder-origin.ts";

describe("isGrokEmbedderOrigin", () => {
  it("returns true for grok.com", () => {
    assert.equal(isGrokEmbedderOrigin("https://grok.com"), true);
  });

  it("returns true for subdomains of grok.com", () => {
    assert.equal(isGrokEmbedderOrigin("https://test.grok.com"), true);
    assert.equal(isGrokEmbedderOrigin("http://dev.grok.com"), true);
  });

  it("returns true for localhost and local IP addresses", () => {
    assert.equal(isGrokEmbedderOrigin("http://localhost:3000"), true);
    assert.equal(isGrokEmbedderOrigin("http://127.0.0.1:8080"), true);
    assert.equal(isGrokEmbedderOrigin("http://[::1]:8080"), true);
  });

  it("returns false for non-grok origins", () => {
    assert.equal(isGrokEmbedderOrigin("https://example.com"), false);
    assert.equal(isGrokEmbedderOrigin("https://grok.com.evil.com"), false);
    assert.equal(isGrokEmbedderOrigin("https://mygrok.com"), false);
  });

  it("returns false for non-http/https protocols", () => {
    assert.equal(isGrokEmbedderOrigin("ftp://grok.com"), false);
    assert.equal(isGrokEmbedderOrigin("file://localhost/foo"), false);
    assert.equal(isGrokEmbedderOrigin("ws://localhost"), false);
    assert.equal(isGrokEmbedderOrigin("wss://grok.com"), false);
  });

  it("returns false for invalid URLs", () => {
    assert.equal(isGrokEmbedderOrigin("not-a-url"), false);
    assert.equal(isGrokEmbedderOrigin(""), false);
  });
});

describe("isSandboxPreviewGuestHost", () => {
  it("returns true for grok-sandbox.com and subdomains", () => {
    assert.equal(isSandboxPreviewGuestHost("grok-sandbox.com"), true);
    assert.equal(isSandboxPreviewGuestHost("test.grok-sandbox.com"), true);
  });

  it("returns false for other hosts", () => {
    assert.equal(isSandboxPreviewGuestHost("example.com"), false);
    assert.equal(isSandboxPreviewGuestHost("mygrok-sandbox.com"), false);
  });
});

describe("resolveParentEmbedderOrigin", () => {
  it("returns null if parentIsSelf is true", () => {
    assert.equal(
      resolveParentEmbedderOrigin(true, "https://grok.com", null, ""),
      null
    );
  });

  it("resolves from referrer if it is a grok embedder origin", () => {
    assert.equal(
      resolveParentEmbedderOrigin(false, "https://grok.com", null, ""),
      "https://grok.com"
    );
  });

  it("resolves from ancestorOrigin if referrer is not available", () => {
    assert.equal(
      resolveParentEmbedderOrigin(false, "", "https://test.grok.com", ""),
      "https://test.grok.com"
    );
  });

  it("resolves from referrer if it matches sandbox preview guest host", () => {
    assert.equal(
      resolveParentEmbedderOrigin(false, "https://example.com", null, "grok-sandbox.com"),
      "https://example.com"
    );
  });

  it("resolves from referrer if it matches remint preview pair", () => {
    assert.equal(
      resolveParentEmbedderOrigin(false, "https://example.com", null, "app.preview.example.com"),
      "https://example.com"
    );
    assert.equal(
      resolveParentEmbedderOrigin(false, "https://grok.example.com", null, "app.preview.example.com"),
      "https://grok.example.com"
    );
  });

  it("returns null if no matching origin is found", () => {
    assert.equal(
      resolveParentEmbedderOrigin(false, "https://evil.com", "https://bad.com", "grok.com"),
      null
    );
    assert.equal(
      resolveParentEmbedderOrigin(false, "", null, ""),
      null
    );
  });

  it("handles non-http/https candidates", () => {
    assert.equal(
      resolveParentEmbedderOrigin(false, "ftp://grok.com", null, ""),
      null
    );
  });

  it("handles candidates without protocol", () => {
    assert.equal(
      resolveParentEmbedderOrigin(false, "grok.com", null, ""),
      "https://grok.com"
    );
  });

  it("handles invalid candidates gracefully", () => {
    assert.equal(
      resolveParentEmbedderOrigin(false, "http://[invalid-url]", null, ""),
      null
    );
  });
});
