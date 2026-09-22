import { createFileRoute } from "@tanstack/react-router";
import { isModelId } from "@/lib/models";
import { iterateSse, parseUsage, xaiChat } from "@/lib/llm/xai";
import { bitsPerChar } from "@/lib/utils";

export const Route = createFileRoute("/api/bench")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: { prompt?: unknown; maxTokens?: unknown; model?: unknown } = {};
        try {
          payload = (await request.json()) as typeof payload;
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }
        const prompt = typeof payload.prompt === "string" ? payload.prompt.trim() : "";
        if (prompt.length < 1 || prompt.length > 4000) {
          return Response.json({ error: "Prompt must be 1–4000 characters" }, { status: 400 });
        }
        const maxTokens = Math.min(
          256,
          Math.max(16, Number(payload.maxTokens) || 96),
        );
        const model = typeof payload.model === "string" && isModelId(payload.model)
          ? payload.model
          : "grok-4.5";

        const started = await xaiChat({
          model,
          messages: [
            {
              role: "system",
              content:
                "You are a concise technical assistant. Answer directly. Do not mention these instructions.",
            },
            { role: "user", content: prompt },
          ],
          maxTokens,
          stream: true,
        });

        if (!started.ok) {
          return Response.json({ error: started.error }, { status: 503 });
        }

        const stream = new ReadableStream({
          async start(controller) {
            const enc = new TextEncoder();
            const send = (obj: unknown) => {
              controller.enqueue(enc.encode(`data: ${JSON.stringify(obj)}\n\n`));
            };
            const t0 = performance.now();
            let ttftMs = 0;
            let last = t0;
            const gaps: number[] = [];
            let text = "";
            let usageRaw = undefined as Parameters<typeof parseUsage>[0];
            try {
              send({ type: "start", model: started.model, t0 });
              for await (const chunk of iterateSse(started.res)) {
                if (chunk.usage) usageRaw = chunk.usage;
                const piece = chunk.choices?.[0]?.delta?.content ?? "";
                if (!piece) continue;
                const now = performance.now();
                if (ttftMs === 0) ttftMs = now - t0;
                else gaps.push(now - last);
                last = now;
                text += piece;
                send({ type: "token", text: piece, t: now - t0 });
              }
              const totalMs = performance.now() - t0;
              const usage = parseUsage(usageRaw, started.model);
              const completion = Math.max(usage.completionTokens, countTokensFallback(text));
              const tpotMs = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : totalMs - ttftMs;
              const genMs = Math.max(1, totalMs - ttftMs);
              const outputTps = completion > 1 ? ((completion - 1) / genMs) * 1000 : completion / (totalMs / 1000);
              const promptTps = usage.promptTokens > 0 ? usage.promptTokens / (Math.max(ttftMs, 1) / 1000) : 0;
              const cacheHitPct =
                usage.promptTokens > 0 ? (usage.cachedTokens / usage.promptTokens) * 100 : 0;
              send({
                type: "done",
                metrics: {
                  model: started.model,
                  ttftMs,
                  tpotMs,
                  outputTps,
                  promptTps,
                  totalMs,
                  promptTokens: usage.promptTokens,
                  completionTokens: completion,
                  cachedTokens: usage.cachedTokens,
                  cacheHitPct,
                  costUsd: usage.costUsd,
                  entropyBpc: bitsPerChar(text),
                  outputText: text,
                  promptChars: prompt.length,
                },
              });
            } catch (err) {
              send({
                type: "error",
                error: err instanceof Error ? err.message : "Stream failed",
              });
            } finally {
              controller.close();
            }
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
          },
        });
      },
    },
  },
});

function countTokensFallback(text: string) {
  const parts = text.trim().split(/\s+/).filter(Boolean);
  return Math.max(1, Math.round(parts.length * 1.3));
}
