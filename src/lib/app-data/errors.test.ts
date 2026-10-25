import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { classifyCallToolError } from "./errors.ts";

describe("classifyCallToolError", () => {
  it("returns null for successful results", () => {
    assert.equal(classifyCallToolError({ ok: true, data: {} }), null);
  });

  it("classifies a pending preview token as pending before any other kind", () => {
    const state = classifyCallToolError({
      ok: false,
      data: null,
      pending: true,
      errorMessage: "connector_token_pending: the preview has not received the connector token yet",
    });
    assert.equal(state?.kind, "pending");
    assert.match(state?.message ?? "", /Connecting/);
    assert.match(state?.detail ?? "", /connector_token_pending/);
  });

  it("classifies a deployed missing token as error, not a login CTA", () => {
    const state = classifyCallToolError({
      ok: false,
      data: null,
      errorMessage: "missing_connector_token: open this app through the edge gate",
    });
    assert.equal(state?.kind, "error");
    assert.match(state?.detail ?? "", /missing_connector_token/);
  });

  it("classifies gate loginRequired without a missing-token message as login", () => {
    const state = classifyCallToolError({
      ok: false,
      data: null,
      loginRequired: true,
      errorMessage: "login required",
    });
    assert.equal(state?.kind, "login");
    assert.equal(state?.detail, "login required");
  });

  it("classifies not_connected and failed_precondition", () => {
    assert.equal(
      classifyCallToolError({
        ok: false,
        data: null,
        errorMessage: "connector_not_connected: Notion",
      })?.kind,
      "not_connected",
    );
    assert.equal(
      classifyCallToolError({
        ok: false,
        data: null,
        errorMessage: "FAILED_PRECONDITION: no connector",
      })?.kind,
      "not_connected",
    );
  });

  it("classifies scope_denied without claiming a missing grant", () => {
    const state = classifyCallToolError({
      ok: false,
      data: null,
      errorMessage: "scope_denied: tool notion-list-recent-pages not in grant scopes",
    });
    assert.equal(state?.kind, "scope_denied");
    assert.match(state?.message ?? "", /tool outside its grant/);
    assert.match(state?.detail ?? "", /notion-list-recent-pages/);
  });

  it("classifies access_denied", () => {
    assert.equal(
      classifyCallToolError({
        ok: false,
        data: null,
        errorMessage: "access_denied",
      })?.kind,
      "access_denied",
    );
  });

  it("falls back to a generic error with the raw message", () => {
    const state = classifyCallToolError({
      ok: false,
      data: null,
      errorMessage: "boom",
    });
    assert.equal(state?.kind, "error");
    assert.equal(state?.message, "boom");
    const empty = classifyCallToolError({ ok: false, data: null });
    assert.equal(empty?.kind, "error");
    assert.equal(empty?.message, "Something went wrong. Try again.");
    assert.equal(empty?.detail, undefined);
  });
});
