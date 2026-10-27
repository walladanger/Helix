export function letterOf(text: string) {
  const m = text.trim().match(/^[A-D]/i);
  return m ? m[0].toUpperCase() : "";
}

export function lastNumber(text: string) {
  const matches = text.replace(/,/g, "").match(/-?\d+(\.\d+)?/g);
  return matches ? Number(matches[matches.length - 1]) : NaN;
}

export function extractFn(text: string, name: string) {
  const cleaned = text.replace(/```(?:javascript|js)?/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf(`function ${name}`);
  const arrow = cleaned.indexOf(`${name} =`);
  const constn = cleaned.indexOf(`const ${name}`);
  let src = cleaned;
  const idx = [start, constn, arrow].filter((n) => n >= 0);
  if (idx.length) src = cleaned.slice(Math.min(...idx));
  if (/fetch|import|require|process|globalThis|window|eval|Function/.test(src)) return null;
  return src;
}

export function runTests(src: string, name: string, tests: { args: unknown[]; expect: unknown }[]) {
  try {
    const fn = new Function(`${src}; return ${name};`)();
    if (typeof fn !== "function") return { passed: 0, notes: [`${name} is not a function`] };
    let passed = 0;
    const notes: string[] = [];
    for (const t of tests) {
      const got = fn(...t.args);
      if (Object.is(got, t.expect)) passed += 1;
      else
        notes.push(
          `${name}(${JSON.stringify(t.args)}) → ${JSON.stringify(got)}, expected ${JSON.stringify(t.expect)}`,
        );
    }
    return { passed, notes };
  } catch (err) {
    return { passed: 0, notes: [`${name} threw: ${err instanceof Error ? err.message : "error"}`] };
  }
}

export function entropy(text: string) {
  if (text.length < 8) return null;
  const freq = new Map<string, number>();
  for (const ch of text) freq.set(ch, (freq.get(ch) ?? 0) + 1);
  let h = 0;
  for (const c of freq.values()) {
    const p = c / text.length;
    h -= p * Math.log2(p);
  }
  return h;
}
