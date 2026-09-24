import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import test from "node:test";
import { parseCatalog } from "./generate-runtime-catalog.mjs";

test("every approved runtime has a unique, sourced, unverified integration route", () => {
  const source = readFileSync("docs/reference/runtime-catalog.md", "utf8");
  const records = parseCatalog(source);
  const checkedIn = JSON.parse(readFileSync("src/lib/runtimes/catalog.json", "utf8"));
  assert.deepEqual(checkedIn, records, "generated registry must match the approved source");
  assert.equal(records.length, 63);
  assert.ok(records.every(({ support, documentation }) =>
    support === "catalogued" && documentation.startsWith("https://")));
  assert.equal(records.find(({ id }) => id === "llama-cpp")?.install, "bundled-windows");
  assert.equal(records.find(({ id }) => id === "lm-studio")?.install, "official-separate-installer");
  assert.ok(!records.some(({ id }) => id === "openai" || id === "anthropic"));
});
