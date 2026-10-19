import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getSession, getSessionState, sessionFetch } from "@/lib/auth/session";

vi.mock("server-only", () => ({}));
const cookieState = vi.hoisted(() => ({ authenticated: true, refresh: false }));
vi.mock("next/headers", () => ({ cookies: async () => ({
  has: (name: string) => name === "circa_at" ? cookieState.authenticated : name === "circa_rt" && cookieState.refresh,
  toString: () => "circa_at=secret; circa_rt=refresh",
}) }));
beforeEach(() => { cookieState.authenticated = true; cookieState.refresh = false; });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("server session lookup", () => {
  it("does not contact the API for an anonymous visit", async () => {
    cookieState.authenticated = false;
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 401 }));
    vi.stubGlobal("fetch", fetch);
    expect(await getSession()).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("preserves an unavailable session when navigation could not refresh expired access", async () => {
    cookieState.authenticated = false;
    cookieState.refresh = true;
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    expect(await getSessionState()).toEqual({ status: "unavailable" });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("forwards inbound cookies without caching or exposing tokens in the account", async () => {
    vi.stubEnv("API_ORIGIN", "http://localhost:5040");
    const account = { id: "user-id", username: "reader", role: "author", createdAt: "2026-10-20" };
    const fetch = vi.fn().mockResolvedValue(Response.json(account));
    vi.stubGlobal("fetch", fetch);
    expect(await getSession()).toEqual(account);
    const [url, init] = fetch.mock.calls[0];
    expect(String(url)).toBe("http://localhost:5040/api/v1/auth/me");
    expect(init.cache).toBe("no-store");
    expect(init.headers.get("cookie")).toBe("circa_at=secret; circa_rt=refresh");
  });

  it("returns null for signed out while surfacing operational errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 503 })));
    expect(await getSession()).toBeNull();
    await expect(getSession()).rejects.toThrow("503");
  });

  it("reports an unavailable API separately from a guest", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 503 })));
    expect(await getSessionState()).toEqual({ status: "unavailable" });
  });

  it("rethrows Next.js request-rendering signals instead of caching an outage", async () => {
    const signal = Object.assign(new Error("request cookies"), { digest: "DYNAMIC_SERVER_USAGE" });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(signal));
    await expect(getSessionState()).rejects.toBe(signal);
  });

  it("never forwards cookies to another origin", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    await expect(sessionFetch("https://evil.test/api/v1/auth/me")).rejects.toThrow();
    expect(fetch).not.toHaveBeenCalled();
  });
});
