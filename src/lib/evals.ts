export type MmluItem = {
  id: string;
  subject: string;
  question: string;
  choices: [string, string, string, string];
  answer: "A" | "B" | "C" | "D";
};

export type GsmItem = {
  id: string;
  question: string;
  answer: number;
};

export type CodeItem = {
  id: string;
  prompt: string;
  name: string;
  tests: { args: unknown[]; expect: unknown }[];
};

export const MMLU_ITEMS: MmluItem[] = [
  {
    id: "m1",
    subject: "Geography",
    question: "What is the capital of Australia?",
    choices: ["Sydney", "Canberra", "Melbourne", "Perth"],
    answer: "B",
  },
  {
    id: "m2",
    subject: "Physics",
    question: "Newton's second law states that force equals:",
    choices: ["mass × velocity", "mass × acceleration", "mass / acceleration", "energy × time"],
    answer: "B",
  },
  {
    id: "m3",
    subject: "Biology",
    question: "In DNA, adenine pairs with:",
    choices: ["Guanine", "Cytosine", "Thymine", "Uracil"],
    answer: "C",
  },
  {
    id: "m4",
    subject: "Literature",
    question: "Who wrote Pride and Prejudice?",
    choices: ["Charlotte Brontë", "Jane Austen", "Mary Shelley", "George Eliot"],
    answer: "B",
  },
  {
    id: "m5",
    subject: "Math",
    question: "The derivative of sin(x) with respect to x is:",
    choices: ["−sin(x)", "tan(x)", "−cos(x)", "cos(x)"],
    answer: "D",
  },
  {
    id: "m6",
    subject: "CS",
    question: "HTTP status 404 means:",
    choices: ["Unauthorized", "Not Found", "Server Error", "Redirect"],
    answer: "B",
  },
];

export const GSM_ITEMS: GsmItem[] = [
  {
    id: "g1",
    question: "A shop has 15 apples, sells 6, then buys 8. How many apples are there now?",
    answer: 17,
  },
  {
    id: "g2",
    question: "A train travels 60 miles per hour for 2.5 hours. How many miles does it travel?",
    answer: 150,
  },
  {
    id: "g3",
    question: "What is 3/4 of 80?",
    answer: 60,
  },
  {
    id: "g4",
    question: "A book costs $12. After a 25% discount, what is the price in dollars?",
    answer: 9,
  },
  {
    id: "g5",
    question: "The mean of 4, 8, 10, and 18 is?",
    answer: 10,
  },
];

export const CODE_ITEMS: CodeItem[] = [
  {
    id: "c1",
    name: "sumList",
    prompt:
      "Write a JavaScript function named sumList(arr) that returns the sum of numbers in arr. Empty list sums to 0.",
    tests: [
      { args: [[1, 2, 3]], expect: 6 },
      { args: [[]], expect: 0 },
      { args: [[-2, 5]], expect: 3 },
    ],
  },
  {
    id: "c2",
    name: "isPalindrome",
    prompt:
      "Write a JavaScript function named isPalindrome(s) that returns true if s reads the same forwards and backwards, ignoring case. Otherwise false.",
    tests: [
      { args: ["Racecar"], expect: true },
      { args: ["hello"], expect: false },
      { args: ["a"], expect: true },
    ],
  },
  {
    id: "c3",
    name: "factorial",
    prompt:
      "Write a JavaScript function named factorial(n) that returns n! for integer n >= 0. factorial(0) is 1.",
    tests: [
      { args: [0], expect: 1 },
      { args: [5], expect: 120 },
      { args: [3], expect: 6 },
    ],
  },
];

export const RAG_DOCS = [
  {
    id: "d1",
    title: "Helix Overview",
    text: "Helix is an LLM observability desktop that measures latency, hardware, quality, and cost. First released in 2026.",
    tags: ["helix", "observability", "desktop", "2026"],
  },
  {
    id: "d2",
    title: "Latency",
    text: "Time to first token (TTFT) is the delay from request to the first generated token. Time per output token (TPOT) is the average interval between subsequent tokens.",
    tags: ["ttft", "tpot", "latency", "token"],
  },
  {
    id: "d3",
    title: "Hardware",
    text: "The KV cache stores key and value tensors for each transformer layer so previous tokens are not recomputed. Cache size grows linearly with context length.",
    tags: ["kv", "cache", "vram", "context"],
  },
  {
    id: "d4",
    title: "Pricing",
    text: "Grok 4.5 API pricing is $2.00 per million input tokens and $6.00 per million output tokens below 200k prompt tokens. Cached input is $0.50 per million.",
    tags: ["price", "grok", "tokens", "cached"],
  },
  {
    id: "d5",
    title: "Birds",
    text: "The Caspian tern nests on sandy islands and feeds primarily on small fish.",
    tags: ["tern", "bird", "fish"],
  },
  {
    id: "d6",
    title: "Energy",
    text: "An H100 GPU has a 700W TDP. Energy per 1,000 tokens is estimated from TDP, utilization, and generation duration.",
    tags: ["h100", "energy", "watts", "tokens"],
  },
] as const;

export const RAG_QUERY =
  "What is TTFT, and what does Helix charge for Grok input tokens?";

export const RAG_RELEVANT = new Set(["d2", "d4"]);

export function retrieveDocs(query: string, k = 4) {
  const terms = query.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 2);
  const scored = RAG_DOCS.map((doc) => {
    const hay = `${doc.title} ${doc.text} ${doc.tags.join(" ")}`.toLowerCase();
    const score = terms.reduce((acc, t) => acc + (hay.includes(t) ? 1 : 0), 0);
    return { doc, score };
  })
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
  return scored;
}

export function contextPrecision(ids: string[]) {
  if (ids.length === 0) return 0;
  const hits = ids.filter((id) => RAG_RELEVANT.has(id)).length;
  return hits / ids.length;
}

export function faithfulness(answer: string, context: string) {
  const sentences = answer
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12);
  if (sentences.length === 0) return 0;
  const ctx = context.toLowerCase();
  const supported = sentences.filter((s) => {
    const words = s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3);
    const hits = words.filter((w) => ctx.includes(w)).length;
    return words.length > 0 && hits / words.length >= 0.45;
  }).length;
  return supported / sentences.length;
}

export function answerRelevance(answer: string, query: string) {
  const q = query.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);
  if (q.length === 0) return 0;
  const a = answer.toLowerCase();
  const hits = q.filter((w) => a.includes(w)).length;
  return hits / q.length;
}
