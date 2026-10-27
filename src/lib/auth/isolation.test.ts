import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isAllowedSameSiteRequest, CrossSiteRequestError } from "./isolation.server.ts";

describe("isAllowedSameSiteRequest", () => {
  it("returns true when there is no sec-fetch-site header", () => {
    assert.equal(isAllowedSameSiteRequest(new Headers(), "GET"), true);
  });

  it("returns true for same-origin requests", () => {
    assert.equal(isAllowedSameSiteRequest(new Headers({ "sec-fetch-site": "same-origin" }), "GET"), true);
  });

  it("returns true for none site requests", () => {
    assert.equal(isAllowedSameSiteRequest(new Headers({ "sec-fetch-site": "none" }), "GET"), true);
  });

  it("returns true for top-level GET navigation from cross-site", () => {
    const headers = new Headers({
      "sec-fetch-site": "cross-site",
      "sec-fetch-mode": "navigate",
      "sec-fetch-dest": "document",
    });
    assert.equal(isAllowedSameSiteRequest(headers, "GET"), true);
  });

  it("returns true for top-level GET navigation from same-site", () => {
    const headers = new Headers({
      "sec-fetch-site": "same-site",
      "sec-fetch-mode": "navigate",
      "sec-fetch-dest": "document",
    });
    assert.equal(isAllowedSameSiteRequest(headers, "GET"), true);
  });

  it("returns false for navigate POST requests", () => {
    const headers = new Headers({
      "sec-fetch-site": "cross-site",
      "sec-fetch-mode": "navigate",
      "sec-fetch-dest": "document",
    });
    assert.equal(isAllowedSameSiteRequest(headers, "POST"), false);
  });

  it("returns false for navigate GET object destination", () => {
    const headers = new Headers({
      "sec-fetch-site": "cross-site",
      "sec-fetch-mode": "navigate",
      "sec-fetch-dest": "object",
    });
    assert.equal(isAllowedSameSiteRequest(headers, "GET"), false);
  });

  it("returns false for navigate GET embed destination", () => {
    const headers = new Headers({
      "sec-fetch-site": "cross-site",
      "sec-fetch-mode": "navigate",
      "sec-fetch-dest": "embed",
    });
    assert.equal(isAllowedSameSiteRequest(headers, "GET"), false);
  });

  it("returns false for cross-site cors GET request", () => {
    const headers = new Headers({
      "sec-fetch-site": "cross-site",
      "sec-fetch-mode": "cors",
      "sec-fetch-dest": "empty",
    });
    assert.equal(isAllowedSameSiteRequest(headers, "GET"), false);
  });

  it("returns false for same-site no-cors request", () => {
    const headers = new Headers({
      "sec-fetch-site": "same-site",
      "sec-fetch-mode": "no-cors",
      "sec-fetch-dest": "script",
    });
    assert.equal(isAllowedSameSiteRequest(headers, "GET"), false);
  });
});

describe("CrossSiteRequestError", () => {
  it("has the expected properties", () => {
    const error = new CrossSiteRequestError();
    assert.equal(error.status, 403);
    assert.equal(error.name, "CrossSiteRequestError");
    assert.equal(error.message, "Forbidden: cross-site request blocked");
  });
});
