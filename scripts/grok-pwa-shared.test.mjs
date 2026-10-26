import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  escapeHtml,
  acceptsHtml,
  titleFromDocument,
  resolveOgTitle,
  siteHasCustomCard,
  stripShareMetaTags,
  normalizeHeadContext,
  grokPwaHeadTags,
  grokExtensionsHeadTags,
  DEFAULT_APP_NAME,
} from "./grok-pwa-shared.mjs";


test("escapeHtml encodes special characters", () => {
  assert.equal(escapeHtml("&"), "&amp;");
  assert.equal(escapeHtml("<"), "&lt;");
  assert.equal(escapeHtml(">"), "&gt;");
  assert.equal(escapeHtml('"'), "&quot;");
  assert.equal(escapeHtml("'"), "&#39;");
  assert.equal(escapeHtml("<script>alert('x & y')</script>"), "&lt;script&gt;alert(&#39;x &amp; y&#39;)&lt;/script&gt;");
});

test("escapeHtml handles non-string input", () => {
  assert.equal(escapeHtml(null), "null");
  assert.equal(escapeHtml(undefined), "undefined");
  assert.equal(escapeHtml(123), "123");
  assert.equal(escapeHtml({}), "[object Object]");
});

test("acceptsHtml accepts text/html and */*", () => {
  assert.equal(acceptsHtml("text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8"), true);
  assert.equal(acceptsHtml("text/html"), true);
  assert.equal(acceptsHtml("*/*"), true);
});

test("acceptsHtml rejects non-html accept headers", () => {
  assert.equal(acceptsHtml("application/json"), false);
  assert.equal(acceptsHtml("text/plain"), false);
});

test("acceptsHtml returns true for missing or empty accept headers", () => {
  assert.equal(acceptsHtml(""), true);
  assert.equal(acceptsHtml(undefined), true);
  assert.equal(acceptsHtml(null), true);
});

test("titleFromDocument extracts and unescapes document title", () => {
  assert.equal(titleFromDocument("<html><head><title>My App</title></head></html>"), "My App");
  assert.equal(titleFromDocument("<html><head><title>  Spaced Out  </title></head></html>"), "Spaced Out");
  assert.equal(titleFromDocument("<html><head><title>Cats &amp; Dogs</title></head></html>"), "Cats & Dogs");
  assert.equal(titleFromDocument("<html><head><title>Hello &lt;World&gt;</title></head></html>"), "Hello <World>");
});

test("titleFromDocument returns empty string for missing or invalid title", () => {
  assert.equal(titleFromDocument("<html><head></head></html>"), "");
  assert.equal(titleFromDocument(""), "");
  assert.equal(titleFromDocument(undefined), "");
  assert.equal(titleFromDocument(null), "");
});

test("resolveOgTitle uses site title > document title > host name > fallback", () => {
  // site title wins
  assert.equal(resolveOgTitle({ title: "Site Title" }, "App Name", "host.com", "Doc Title"), "Site Title");

  // document title wins over host and fallback
  assert.equal(resolveOgTitle({}, "App Name", "host.com", "Doc Title"), "Doc Title");

  // host derived name wins over fallback
  assert.equal(resolveOgTitle({}, "App Name", "my-cool-app.grok.me", ""), "My Cool App");

  // custom appName arg wins over DEFAULT_APP_NAME if host doesn't give a custom name
  assert.equal(resolveOgTitle({}, "Custom Default", "localhost", ""), "Custom Default");

  // ultimate fallback
  assert.equal(resolveOgTitle({}, "", "", ""), DEFAULT_APP_NAME);
});

test("siteHasCustomCard returns true only for 'custom'", () => {
  assert.equal(siteHasCustomCard({ card: "custom" }), true);
  assert.equal(siteHasCustomCard({ card: "CUSTOM" }), true); // case-insensitive as per source

  assert.equal(siteHasCustomCard({ card: "other" }), false);
  assert.equal(siteHasCustomCard({}), false);
  assert.equal(siteHasCustomCard(undefined), false);
});

test("stripShareMetaTags removes matching share tags and keeps others", () => {
  const html = `
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width">
        <meta property="og:title" content="My App">
        <meta name="twitter:card" content="summary">
        <meta property="og:site_name" content="Site">
      </head>
    </html>
  `;
  const stripped = stripShareMetaTags(html);

  // Kept
  assert.equal(stripped.includes('<meta charset="utf-8">'), true);
  assert.equal(stripped.includes('<meta name="viewport"'), true);

  // Removed
  assert.equal(stripped.includes('og:title'), false);
  assert.equal(stripped.includes('twitter:card'), false);
  assert.equal(stripped.includes('og:site_name'), false);
});

test("normalizeHeadContext resolves default context values", () => {
  const prevProjectId = process.env.VITE_PROJECT_ID;
  const prevCreatorId = process.env.VITE_X_CREATOR_ID;
  delete process.env.VITE_PROJECT_ID;
  delete process.env.VITE_X_CREATOR_ID;

  const tmpCwd = mkdtempSync(join(tmpdir(), "grok-test-"));

  try {
    const ctx = normalizeHeadContext({ cwd: tmpCwd });
    assert.equal(ctx.appName, DEFAULT_APP_NAME);
    assert.equal(ctx.projectId, "");
    assert.equal(ctx.creatorId, "");
    assert.equal(ctx.host, "");
    assert.equal(ctx.cwd, tmpCwd);
  } finally {
    rmSync(tmpCwd, { recursive: true, force: true });
    if (prevProjectId !== undefined) process.env.VITE_PROJECT_ID = prevProjectId;
    if (prevCreatorId !== undefined) process.env.VITE_X_CREATOR_ID = prevCreatorId;
  }
});

test("normalizeHeadContext respects provided context values", () => {
  const ctx = normalizeHeadContext({
    appName: "My Custom App",
    projectId: "proj_123",
    creator: "@user",
    creatorId: "456",
    host: "custom.com",
    site: { title: "Custom Title" }, // site title overrides appName in resolution
    cwd: "/fake/path"
  });

  assert.equal(ctx.appName, "Custom Title");
  assert.equal(ctx.projectId, "proj_123");
  assert.equal(ctx.creator, "@user");
  assert.equal(ctx.creatorId, "456");
  assert.equal(ctx.host, "custom.com");
  assert.equal(ctx.cwd, "/fake/path");
});

test("grokPwaHeadTags includes default app name and valid tags", () => {
  const tags = grokPwaHeadTags();

  const dict = Object.fromEntries(tags);
  assert.ok(dict.manifest.includes('href="/__grok/manifest.webmanifest"'));
  assert.ok(dict["apple-touch-icon"].includes('href="/__grok/icon-180.png"'));
  assert.ok(dict["apple-mobile-web-app-title"].includes(`content="${DEFAULT_APP_NAME}"`));
  assert.ok(dict["apple-mobile-web-app-status-bar-style"].includes('content="black"'));
  assert.ok(dict["theme-color"].includes('content="#000000"'));
});

test("grokPwaHeadTags escapes custom app name", () => {
  const tags = grokPwaHeadTags("Custom & App");
  const dict = Object.fromEntries(tags);

  assert.ok(dict["apple-mobile-web-app-title"].includes('content="Custom &amp; App"'));
});

test("grokExtensionsHeadTags returns script without project id when VITE_PROJECT_ID is empty", () => {
  const prevProjectId = process.env.VITE_PROJECT_ID;
  delete process.env.VITE_PROJECT_ID;

  try {
    const tags = grokExtensionsHeadTags();
    assert.equal(tags.length, 1);

    const script = tags[0];
    assert.ok(script.includes('<script src="https://grok.com/grok-app-builder/extensions.js" defer></script>'));
    assert.equal(script.includes('data-project-id'), false);
  } finally {
    if (prevProjectId !== undefined) process.env.VITE_PROJECT_ID = prevProjectId;
  }
});

test("grokExtensionsHeadTags returns meta and script when projectId is provided", () => {
  const tags = grokExtensionsHeadTags("proj_123");
  assert.equal(tags.length, 2);

  const meta = tags[0];
  assert.ok(meta.includes('<meta name="grok-project-id" content="proj_123">'));

  const script = tags[1];
  assert.ok(script.includes('<script src="https://grok.com/grok-app-builder/extensions.js" data-project-id="proj_123" defer></script>'));
});

test("grokExtensionsHeadTags escapes project id", () => {
  const tags = grokExtensionsHeadTags('proj_123"<>');
  assert.equal(tags.length, 2);

  const meta = tags[0];
  assert.ok(meta.includes('content="proj_123&quot;&lt;&gt;"'));

  const script = tags[1];
  assert.ok(script.includes('data-project-id="proj_123&quot;&lt;&gt;"'));
});
