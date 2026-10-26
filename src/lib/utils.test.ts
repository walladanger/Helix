import { describe, it } from "node:test";
import assert from "node:assert";
import {
  cn,
  fmtMs,
  fmtTps,
  fmtUsd,
  fmtBytes,
  fmtNum,
  fmtPct,
  clamp,
  bitsPerChar,
} from "./utils.ts";

describe("cn", () => {
  it("merges tailwind classes and handles clsx values", () => {
    assert.strictEqual(cn("a", "b"), "a b");
    assert.strictEqual(cn("p-1", "p-2"), "p-2");
    assert.strictEqual(cn("text-red-500", undefined, null, false, "bg-blue-500"), "text-red-500 bg-blue-500");
    assert.strictEqual(cn({ "a": true, "b": false }, "c"), "a c");
  });
});

describe("fmtMs", () => {
  it("formats milliseconds", () => {
    assert.strictEqual(fmtMs(null), "—");
    assert.strictEqual(fmtMs(undefined), "—");
    assert.strictEqual(fmtMs(NaN), "—");
    assert.strictEqual(fmtMs(Infinity), "—");

    assert.strictEqual(fmtMs(5.123), "5.12 ms");
    assert.strictEqual(fmtMs(9.99), "9.99 ms");
    assert.strictEqual(fmtMs(10.123), "10 ms");
    assert.strictEqual(fmtMs(999.9), "1000 ms"); // rounded
    assert.strictEqual(fmtMs(1500), "1.50 s");
    assert.strictEqual(fmtMs(0), "0.00 ms");
    assert.strictEqual(fmtMs(-5), "-5.00 ms");
  });
});

describe("fmtTps", () => {
  it("formats tokens per second", () => {
    assert.strictEqual(fmtTps(null), "—");
    assert.strictEqual(fmtTps(undefined), "—");
    assert.strictEqual(fmtTps(NaN), "—");
    assert.strictEqual(fmtTps(Infinity), "—");

    assert.strictEqual(fmtTps(0), "0.0 t/s");
    assert.strictEqual(fmtTps(12.34), "12.3 t/s");
    assert.strictEqual(fmtTps(12.35), "12.3 t/s");
    assert.strictEqual(fmtTps(-5.67), "-5.7 t/s");
  });
});

describe("fmtUsd", () => {
  it("formats USD currency", () => {
    assert.strictEqual(fmtUsd(null), "—");
    assert.strictEqual(fmtUsd(undefined), "—");
    assert.strictEqual(fmtUsd(NaN), "—");
    assert.strictEqual(fmtUsd(Infinity), "—");

    assert.strictEqual(fmtUsd(0), "$0");
    assert.strictEqual(fmtUsd(0.0000001), "$0");
    assert.strictEqual(fmtUsd(-0.0000001), "$0");

    assert.strictEqual(fmtUsd(0.005), "$0.005000");
    assert.strictEqual(fmtUsd(-0.005), "$-0.005000");

    assert.strictEqual(fmtUsd(0.5), "$0.5000");
    assert.strictEqual(fmtUsd(-0.5), "$-0.5000");

    assert.strictEqual(fmtUsd(1.234), "$1.23");
    assert.strictEqual(fmtUsd(1.235), "$1.24"); // Number.toFixed behavior
    assert.strictEqual(fmtUsd(-1.234), "$-1.23");
    assert.strictEqual(fmtUsd(1000.5), "$1000.50");
  });
});

describe("fmtBytes", () => {
  it("formats bytes", () => {
    assert.strictEqual(fmtBytes(null), "—");
    assert.strictEqual(fmtBytes(undefined), "—");
    assert.strictEqual(fmtBytes(NaN), "—");
    assert.strictEqual(fmtBytes(Infinity), "—");

    assert.strictEqual(fmtBytes(0), "0 B");
    assert.strictEqual(fmtBytes(500), "500 B");
    assert.strictEqual(fmtBytes(-500), "-500 B");

    assert.strictEqual(fmtBytes(1024), "1.0 KB");
    assert.strictEqual(fmtBytes(1500), "1.5 KB");
    assert.strictEqual(fmtBytes(-1500), "-1.5 KB");

    assert.strictEqual(fmtBytes(1024 ** 2), "1.0 MB");
    assert.strictEqual(fmtBytes(50 * 1024 ** 2), "50.0 MB");
    assert.strictEqual(fmtBytes(100 * 1024 ** 2), "100 MB");
    assert.strictEqual(fmtBytes(150 * 1024 ** 2), "150 MB");
    assert.strictEqual(fmtBytes(-50 * 1024 ** 2), "-50.0 MB");
    assert.strictEqual(fmtBytes(-150 * 1024 ** 2), "-150 MB");

    assert.strictEqual(fmtBytes(1024 ** 3), "1.00 GB");
    assert.strictEqual(fmtBytes(2.5 * 1024 ** 3), "2.50 GB");
    assert.strictEqual(fmtBytes(-2.5 * 1024 ** 3), "-2.50 GB");
  });
});

describe("fmtNum", () => {
  it("formats numbers with locale and digits", () => {
    assert.strictEqual(fmtNum(null), "—");
    assert.strictEqual(fmtNum(undefined), "—");
    assert.strictEqual(fmtNum(NaN), "—");
    assert.strictEqual(fmtNum(Infinity), "—");

    assert.strictEqual(fmtNum(0), "0");
    assert.strictEqual(fmtNum(1.234), "1.2");
    assert.strictEqual(fmtNum(1.234, 2), "1.23");
    assert.strictEqual(fmtNum(1234.56, 1), (1234.56).toLocaleString(undefined, { maximumFractionDigits: 1 }));
  });
});

describe("fmtPct", () => {
  it("formats percentages", () => {
    assert.strictEqual(fmtPct(null), "—");
    assert.strictEqual(fmtPct(undefined), "—");
    assert.strictEqual(fmtPct(NaN), "—");
    assert.strictEqual(fmtPct(Infinity), "—");

    assert.strictEqual(fmtPct(0), "0%");
    assert.strictEqual(fmtPct(12.3), "12%");
    assert.strictEqual(fmtPct(12.5), "13%");
    assert.strictEqual(fmtPct(-12.5), "-13%"); // fmtPct uses toFixed(0) which rounds -12.5 to -13
  });
});

describe("clamp", () => {
  it("clamps values between min and max", () => {
    assert.strictEqual(clamp(5, 0, 10), 5);
    assert.strictEqual(clamp(-5, 0, 10), 0);
    assert.strictEqual(clamp(15, 0, 10), 10);
    assert.strictEqual(clamp(10, 0, 10), 10);
    assert.strictEqual(clamp(0, 0, 10), 0);
  });
});

describe("bitsPerChar", () => {
  it("calculates Shannon entropy", () => {
    assert.strictEqual(bitsPerChar(""), null);
    assert.strictEqual(bitsPerChar("short"), null);

    // aaaaaaaa => entropy = 0 since it's perfectly predictable
    assert.strictEqual(bitsPerChar("aaaaaaaa"), 0);

    // abcdefgh => 8 unique characters, each 1/8 prob, H = -8 * (1/8 * log2(1/8)) = log2(8) = 3
    assert.strictEqual(bitsPerChar("abcdefgh"), 3);

    // abcdabcd => 4 unique characters, each 2/8 prob, H = -4 * (1/4 * log2(1/4)) = log2(4) = 2
    assert.strictEqual(bitsPerChar("abcdabcd"), 2);
  });
});
