import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

const storage = new Map<string, string>();
global.localStorage = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
  clear: () => storage.clear(),
  length: 0,
  key: () => null,
} as unknown as Storage;

// We must import dynamically to ensure global.localStorage is mocked
// before the zustand persist middleware executes synchronously
const { useDesk, APP_TITLE } = await import("./store.ts");
import type { AppId, BenchMetrics, HostSnapshot, QualityScores } from "./types.ts";

describe("Store", () => {
  beforeEach(() => {
    // Reset Zustand store state before each test
    useDesk.setState(useDesk.getInitialState());
  });

  describe("APP_TITLE", () => {
    it("has a title for every app id", () => {
      const expectedIds: AppId[] = [
        "telemetry",
        "bench",
        "eval",
        "hardware",
        "cost",
        "settings",
        "recycle",
      ];
      for (const id of expectedIds) {
        assert.ok(APP_TITLE[id], `Missing title for ${id}`);
        assert.equal(typeof APP_TITLE[id], "string");
      }
    });
  });

  describe("useDesk window management", () => {
    it("opens a new app", () => {
      useDesk.getState().openApp("settings");
      const state = useDesk.getState();
      const settingsWin = state.windows.find((w) => w.id === "settings");
      assert.ok(settingsWin);
      assert.equal(state.focused, "settings");
      assert.equal(state.startOpen, false);
      assert.equal(settingsWin.z, state.zTop);
      assert.equal(settingsWin.minimized, false);
      assert.equal(settingsWin.maximized, false);
    });

    it("focuses an existing open app instead of duplicating", () => {
      useDesk.getState().openApp("settings");
      let state = useDesk.getState();
      assert.equal(state.windows.filter((w) => w.id === "settings").length, 1);
      const firstZ = state.zTop;

      useDesk.getState().openApp("telemetry");

      useDesk.getState().openApp("settings");
      state = useDesk.getState();
      assert.equal(state.windows.filter((w) => w.id === "settings").length, 1);
      assert.equal(state.focused, "settings");
      assert.ok(state.zTop > firstZ);
    });

    it("closes an app", () => {
      useDesk.getState().openApp("settings");
      assert.ok(useDesk.getState().windows.find((w) => w.id === "settings"));

      useDesk.getState().closeApp("settings");
      const state = useDesk.getState();
      assert.ok(!state.windows.find((w) => w.id === "settings"));
    });

    it("focuses an app", () => {
      useDesk.getState().openApp("settings");
      useDesk.getState().openApp("bench");

      useDesk.getState().focusApp("settings");
      const state = useDesk.getState();
      const settingsWin = state.windows.find((w) => w.id === "settings")!;
      assert.equal(state.focused, "settings");
      assert.equal(settingsWin.z, state.zTop);
      assert.equal(settingsWin.minimized, false);
      assert.equal(state.startOpen, false);
      assert.equal(state.flyout, "none");
    });

    it("toggles minimize", () => {
      useDesk.getState().openApp("settings");
      useDesk.getState().toggleMin("settings");

      let state = useDesk.getState();
      let settingsWin = state.windows.find((w) => w.id === "settings")!;
      assert.equal(settingsWin.minimized, true);
      assert.notEqual(state.focused, "settings");

      useDesk.getState().toggleMin("settings");
      state = useDesk.getState();
      settingsWin = state.windows.find((w) => w.id === "settings")!;
      assert.equal(settingsWin.minimized, false);
      assert.equal(state.focused, "settings");
    });

    it("toggles maximize", () => {
      useDesk.getState().openApp("settings");
      useDesk.getState().toggleMax("settings");

      let state = useDesk.getState();
      let settingsWin = state.windows.find((w) => w.id === "settings")!;
      assert.equal(settingsWin.maximized, true);
      assert.equal(settingsWin.minimized, false);
      assert.equal(state.focused, "settings");

      useDesk.getState().toggleMax("settings");
      state = useDesk.getState();
      settingsWin = state.windows.find((w) => w.id === "settings")!;
      assert.equal(settingsWin.maximized, false);
    });

    it("moves an app", () => {
      useDesk.getState().openApp("settings");
      useDesk.getState().moveApp("settings", 100, 200);
      const state = useDesk.getState();
      const settingsWin = state.windows.find((w) => w.id === "settings")!;
      assert.equal(settingsWin.x, 100);
      assert.equal(settingsWin.y, 200);
    });

    it("resizes an app, constrained to min width/height", () => {
      useDesk.getState().openApp("settings");
      useDesk.getState().resizeApp("settings", 800, 600);
      let state = useDesk.getState();
      let settingsWin = state.windows.find((w) => w.id === "settings")!;
      assert.equal(settingsWin.w, 800);
      assert.equal(settingsWin.h, 600);

      useDesk.getState().resizeApp("settings", 100, 100);
      state = useDesk.getState();
      settingsWin = state.windows.find((w) => w.id === "settings")!;
      assert.equal(settingsWin.w, 360);
      assert.equal(settingsWin.h, 240);
    });
  });

  describe("useDesk start menu, flyout, asleep, search", () => {
    it("sets startOpen and resets flyout", () => {
      useDesk.getState().setStart(true);
      let state = useDesk.getState();
      assert.equal(state.startOpen, true);
      assert.equal(state.flyout, "none");

      useDesk.getState().setFlyout("clock");
      useDesk.getState().setStart(false);
      state = useDesk.getState();
      assert.equal(state.startOpen, false);
      assert.equal(state.flyout, "clock");
    });

    it("sets flyout and resets startOpen", () => {
      useDesk.getState().setStart(true);
      useDesk.getState().setFlyout("tray");
      const state = useDesk.getState();
      assert.equal(state.flyout, "tray");
      assert.equal(state.startOpen, false);
    });

    it("sets asleep and resets startOpen and flyout", () => {
      useDesk.getState().setStart(true);
      useDesk.getState().setFlyout("clock");
      useDesk.getState().setAsleep(true);
      const state = useDesk.getState();
      assert.equal(state.asleep, true);
      assert.equal(state.startOpen, false);
      assert.equal(state.flyout, "none");
    });

    it("sets search", () => {
      useDesk.getState().setSearch("test query");
      assert.equal(useDesk.getState().search, "test query");
    });
  });

  describe("useDesk data actions", () => {
    it("patches settings", () => {
      useDesk.getState().patchSettings({ kwhUsd: 0.2 });
      assert.equal(useDesk.getState().settings.kwhUsd, 0.2);
    });

    it("pushes run and truncates history", () => {
      const mockMetric = {
        id: "m1",
        at: 100,
        model: "grok-2",
        promptChars: 10,
        outputText: "hello",
        ttftMs: 150,
        tpotMs: 50,
        outputTps: 50.5,
        promptTps: 100,
        totalMs: 1000,
        promptTokens: 10,
        completionTokens: 50,
        cachedTokens: 0,
        cacheHitPct: 0,
        costUsd: 0.5,
        entropyBpc: null,
      } as unknown as BenchMetrics;

      useDesk.getState().pushRun(mockMetric);
      let state = useDesk.getState();
      assert.equal(state.history.length, 1);
      assert.equal(state.history[0], mockMetric);
      assert.equal(state.notice, "Probe complete · 50.5 t/s · TTFT 150 ms");

      // push 40 more to test slice
      for (let i = 0; i < 40; i++) {
        useDesk.getState().pushRun(mockMetric);
      }
      state = useDesk.getState();
      assert.equal(state.history.length, 40);
    });

    it("sets quality", () => {
      const qs: QualityScores = {
        at: 100,
        model: "grok-2" as QualityScores["model"],
        mmlu: 85,
        gsm8k: 90,
        humanEval: 75,
        perplexityProxy: 10,
        rag: {
          contextPrecision: 80,
          faithfulness: 85,
          answerRelevance: 90,
        },
        details: { suite: "all", passed: 10, total: 10, notes: [] },
      };
      useDesk.getState().setQuality(qs);
      assert.equal(useDesk.getState().quality, qs);
    });

    it("sets live values", () => {
      useDesk.getState().setLive({ text: "hello", running: true, error: "err" });
      let state = useDesk.getState();
      assert.equal(state.liveText, "hello");
      assert.equal(state.liveRunning, true);
      assert.equal(state.liveError, "err");

      useDesk.getState().setLive({ text: "world" });
      state = useDesk.getState();
      assert.equal(state.liveText, "world");
      assert.equal(state.liveRunning, true);
      assert.equal(state.liveError, "err");

      useDesk.getState().setLive({ error: null });
      assert.equal(useDesk.getState().liveError, null);
    });

    it("sets host", () => {
      const host: HostSnapshot = {
        at: 100,
        heapUsed: 1024,
        heapLimit: 2048,
        cores: 8,
        deviceMemoryGb: 16,
        gpuName: "test gpu",
      };
      useDesk.getState().setHost(host);
      assert.equal(useDesk.getState().host, host);
    });

    it("sets notice", () => {
      useDesk.getState().setNotice("hello notice");
      assert.equal(useDesk.getState().notice, "hello notice");
    });

    it("clears history", () => {
      const mockMetric = {
        id: "m1",
        at: 100,
        model: "grok-2",
        promptChars: 10,
        outputText: "hello",
        ttftMs: 150,
        tpotMs: 50,
        outputTps: 50.5,
        promptTps: 100,
        totalMs: 1000,
        promptTokens: 10,
        completionTokens: 50,
        cachedTokens: 0,
        cacheHitPct: 0,
        costUsd: 0.5,
        entropyBpc: null,
      } as unknown as BenchMetrics;
      useDesk.getState().pushRun(mockMetric);

      useDesk.getState().clearHistory();
      const state = useDesk.getState();
      assert.equal(state.history.length, 0);
      assert.equal(state.quality, null);
      assert.equal(state.notice, "History cleared");
    });
  });
});
