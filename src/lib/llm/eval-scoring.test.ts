import test from "node:test";
import assert from "node:assert/strict";
import { letterOf, lastNumber, extractFn, runTests, entropy } from "./eval-scoring.ts";

test("letterOf", () => {
  assert.equal(letterOf("b) ..."), "B", 'lowercase "b) ..." → "B"');
  assert.equal(letterOf("  a)  "), "A", "leading whitespace trimmed");
  assert.equal(letterOf("e) ..."), "", 'only A-D accepted ("E" → "")');
  assert.equal(letterOf("The answer is C"), "", 'letter must be first ("The answer is C" → "")');
  assert.equal(letterOf("d"), "D");
});

test("lastNumber", () => {
  assert.equal(lastNumber("1,234"), 1234, 'strips thousands commas ("1,234" → 1234)');
  assert.equal(lastNumber("answer is 42 and 3.14"), 3.14, "picks the LAST number, handles decimals");
  assert.equal(lastNumber("value is -5"), -5, "handles negatives");
  assert.ok(Number.isNaN(lastNumber("no numbers here")), "no number → NaN");
});

test("extractFn", () => {
  const src = "```javascript\nfunction add(a, b) { return a + b; }\n```";
  assert.equal(extractFn(src, "add"), "function add(a, b) { return a + b; }", "strips ```javascript fences");

  const src2 = "```js\nconst add = (a, b) => a + b;\n```";
  assert.equal(extractFn(src2, "add"), "const add = (a, b) => a + b;", "strips ```js fences");

  const src3 = "random text\nfunction add() {}\nconst add = () => {}";
  assert.equal(extractFn(src3, "add"), "function add() {}\nconst add = () => {}", "slices from the earliest");

  const src4 = "function bad() { fetch('http://bad.com'); }";
  assert.equal(extractFn(src4, "bad"), null, "returns null when source contains fetch");

  const src5 = "function bad() { process.exit(1); }";
  assert.equal(extractFn(src5, "bad"), null, "returns null when source contains process");

  const src6 = "just some text without the name";
  assert.equal(extractFn(src6, "missing"), "just some text without the name", "returns cleaned text when name not found");
});

test("runTests", () => {
  const src = "function add(a, b) { return a + b; }";
  const tests = [
    { args: [1, 2], expect: 3 },
    { args: [NaN, NaN], expect: NaN }, // Object.is handles NaN
    { args: [0, -0], expect: -0 }, // Object.is fails for 0 and -0
  ];

  const run1 = runTests(src, "add", tests);
  assert.equal(run1.passed, 2, "counts passes using Object.is (NaN matches NaN, 0 does not match -0)");
  assert.equal(run1.notes.length, 1);
  assert.equal(run1.notes[0], "add([0,0]) → 0, expected 0", "produces a note string in the exact format for a failing case");

  const run2 = runTests("const add = 5;", "add", []);
  assert.equal(run2.passed, 0);
  assert.deepEqual(run2.notes, ["add is not a function"], "returns <name> is not a function when name is not a function");

  const run3 = runTests("function boom() { throw new Error('bang'); }", "boom", [{ args: [], expect: 1 }]);
  assert.equal(run3.passed, 0);
  assert.deepEqual(run3.notes, ["boom threw: bang"], "returns <name> threw: <message> when source throws");

  const run4 = runTests("function boom() { throw 'string err'; }", "boom", [{ args: [], expect: 1 }]);
  assert.equal(run4.passed, 0);
  assert.deepEqual(run4.notes, ["boom threw: error"], "returns <name> threw: error when source throws non-Error");
});

test("entropy", () => {
  assert.equal(entropy("short"), null, "null for text shorter than 8 chars");
  assert.equal(entropy("aaaaaaaa"), 0, '0 for "aaaaaaaa"');
  assert.equal(entropy("abababab"), 1, 'exactly 1 for "abababab"');
  assert.equal(entropy("abcdefgh"), 3, '3 for "abcdefgh"');
});
