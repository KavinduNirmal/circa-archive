import { afterEach, describe, expect, it, vi } from "vitest";
import { getSession, sessionFetch } from "@/lib/auth/session";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: async () => ({ toString: () => "circa_at=secret; circa_rt=refresh" }) }));
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("server session lookup", () => {
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

  it("never forwards cookies to another origin", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    await expect(sessionFetch("https://evil.test/api/v1/auth/me")).rejects.toThrow();
    expect(fetch).not.toHaveBeenCalled();
  });
});
