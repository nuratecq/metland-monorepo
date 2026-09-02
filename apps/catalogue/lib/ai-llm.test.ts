import { describe, it, expect, vi, afterEach } from "vitest";
import { tryLLMExplanation } from "./ai.js";

const ENV = { ...process.env };
afterEach(() => {
  process.env = { ...ENV };
  vi.unstubAllGlobals();
});

function mockFetch(impl: (url: string, init: RequestInit) => unknown) {
  const fn = vi.fn(impl as never);
  vi.stubGlobal("fetch", fn);
  return fn;
}

describe("tryLLMExplanation", () => {
  it("returns null without a key — template guardrail is the fallback, not an error", async () => {
    delete process.env.LLM_API_KEY;
    delete process.env.OPENAI_API_KEY;
    const f = mockFetch(() => { throw new Error("must not call"); });
    expect(await tryLLMExplanation("hi")).toBeNull();
    expect(f).not.toHaveBeenCalled();
  });

  it("posts to LLM_HOST with the configured model and stream:false", async () => {
    process.env.LLM_API_KEY = "k";
    process.env.LLM_HOST = "https://gw.example/v1/";  // trailing slash must be trimmed
    process.env.LLM_MODEL = "some/model";
    let seenUrl = "", seenBody: Record<string, unknown> = {};
    mockFetch((url, init) => {
      seenUrl = url;
      seenBody = JSON.parse(String(init.body));
      return { ok: true, json: async () => ({ choices: [{ message: { content: " hasil " } }] }) };
    });
    expect(await tryLLMExplanation("p")).toBe("hasil");
    expect(seenUrl).toBe("https://gw.example/v1/chat/completions");
    expect(seenBody.model).toBe("some/model");
    // SSE would not parse as JSON — the gateway streams unless told otherwise.
    expect(seenBody.stream).toBe(false);
  });

  it("falls back to null on a non-OK response", async () => {
    process.env.LLM_API_KEY = "k";
    mockFetch(() => ({ ok: false, status: 500, json: async () => ({}) }));
    expect(await tryLLMExplanation("p")).toBeNull();
  });

  it("falls back to null when the provider throws (timeout/network)", async () => {
    process.env.LLM_API_KEY = "k";
    mockFetch(() => { throw new Error("The operation was aborted due to timeout"); });
    expect(await tryLLMExplanation("p")).toBeNull();
  });

  it("treats an empty completion as no answer", async () => {
    process.env.LLM_API_KEY = "k";
    mockFetch(() => ({ ok: true, json: async () => ({ choices: [{ message: { content: "   " } }] }) }));
    expect(await tryLLMExplanation("p")).toBeNull();
  });
});

describe("tryLLMExplanation cooldown", () => {
  it("stops calling the provider until the 429 reset_seconds elapse", async () => {
    vi.resetModules();
    process.env.LLM_API_KEY = "k";
    const f = mockFetch(() => ({
      ok: false,
      status: 429,
      json: async () => ({ error: { code: "model_cooldown", reset_seconds: 66 } }),
    }));
    // Fresh module so cooldownUntil starts at 0 regardless of test order.
    // @ts-expect-error query suffix busts the module cache; TS cannot resolve it
    const { tryLLMExplanation: fresh } = await import("./ai.js?cooldown");

    expect(await fresh("p")).toBeNull();
    expect(f).toHaveBeenCalledTimes(1);

    // Second call must short-circuit — the provider said 66s, asking again is waste.
    expect(await fresh("p")).toBeNull();
    expect(f).toHaveBeenCalledTimes(1);

    // Past the window it retries.
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 67_000);
    expect(await fresh("p")).toBeNull();
    expect(f).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it("does not cool down on a non-429 failure", async () => {
    vi.resetModules();
    process.env.LLM_API_KEY = "k";
    const f = mockFetch(() => ({ ok: false, status: 500, json: async () => ({}) }));
    // @ts-expect-error query suffix busts the module cache; TS cannot resolve it
    const { tryLLMExplanation: fresh } = await import("./ai.js?no-cooldown");
    expect(await fresh("p")).toBeNull();
    expect(await fresh("p")).toBeNull();
    expect(f).toHaveBeenCalledTimes(2);
  });
});
