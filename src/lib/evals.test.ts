import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  MMLU_ITEMS,
  GSM_ITEMS,
  CODE_ITEMS,
  RAG_QUERY,
  retrieveDocs,
  contextPrecision,
  faithfulness,
  answerRelevance,
} from "./evals.ts";

describe("Data Integrity", () => {
  it("MMLU_ITEMS is non-empty and has unique ids", () => {
    assert.ok(MMLU_ITEMS.length > 0);
    const ids = new Set(MMLU_ITEMS.map((item) => item.id));
    assert.equal(ids.size, MMLU_ITEMS.length);
  });

  it("GSM_ITEMS is non-empty and has unique ids", () => {
    assert.ok(GSM_ITEMS.length > 0);
    const ids = new Set(GSM_ITEMS.map((item) => item.id));
    assert.equal(ids.size, GSM_ITEMS.length);
  });

  it("CODE_ITEMS is non-empty and has unique ids", () => {
    assert.ok(CODE_ITEMS.length > 0);
    const ids = new Set(CODE_ITEMS.map((item) => item.id));
    assert.equal(ids.size, CODE_ITEMS.length);
  });
});

describe("retrieveDocs", () => {
  it("uses default k=4", () => {
    const docs = retrieveDocs("test query that returns nothing or anything");
    assert.equal(docs.length, 4);
  });

  it("respects k limit", () => {
    const docs = retrieveDocs("test query", 2);
    assert.equal(docs.length, 2);
  });

  it("sorts by score descending", () => {
    const docs = retrieveDocs(RAG_QUERY, 6);
    for (let i = 0; i < docs.length - 1; i++) {
      assert.ok(docs[i].score >= docs[i + 1].score);
    }
  });

  it("RAG_QUERY returns d2 and d4 among top results", () => {
    const docs = retrieveDocs(RAG_QUERY, 4);
    const ids = docs.map((d) => d.doc.id);
    assert.ok(ids.includes("d2"));
    assert.ok(ids.includes("d4"));
  });
});

describe("contextPrecision", () => {
  it("returns 0 for empty array", () => {
    assert.equal(contextPrecision([]), 0);
  });

  it("returns 1 for all relevant", () => {
    assert.equal(contextPrecision(["d2", "d4"]), 1);
  });

  it("returns 0 for none relevant", () => {
    assert.equal(contextPrecision(["d1", "d3"]), 0);
  });

  it("returns 0.5 for mixed", () => {
    assert.equal(contextPrecision(["d2", "d1"]), 0.5);
  });
});

describe("faithfulness", () => {
  it("returns 0 for no long sentences", () => {
    assert.equal(faithfulness("Short.", "Context with some words."), 0);
  });

  it("returns 1 for fully supported", () => {
    assert.equal(
      faithfulness(
        "This is a supported sentence.",
        "A supported context with sentence."
      ),
      1
    );
  });

  it("returns 0 for unsupported", () => {
    assert.equal(
      faithfulness(
        "This is completely unsupported.",
        "A context about something else."
      ),
      0
    );
  });

  it("handles the 0.45 threshold", () => {
    assert.equal(
      faithfulness(
        "Alpha bravo charlie delta echo foxtrot.",
        "alpha bravo charlie"
      ),
      1
    );

    assert.equal(
      faithfulness(
        "Alpha bravo charlie delta echo foxtrot.",
        "alpha bravo"
      ),
      0
    );
  });
});

describe("answerRelevance", () => {
  it("returns 0 for empty query", () => {
    assert.equal(answerRelevance("Some answer", ""), 0);
  });

  it("returns fraction of query words matched in answer for partial hits", () => {
    assert.equal(
      answerRelevance("I know about alpha and bravo.", "what about alpha bravo charlie?"),
      0.6
    );

    assert.equal(
      answerRelevance("alpha bravo", "what about alpha bravo charlie?"),
      0.4
    );
  });
});
