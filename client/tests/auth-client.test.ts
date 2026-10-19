import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authFetch, SignedOutError } from "@/lib/auth/client";

const urlOf = (input: RequestInfo | URL) => input instanceof Request ? input.url : String(input);

afterEach(() => vi.unstubAllGlobals());

describe("browser session requests", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("shares one refresh across concurrent 401s and replays each request body once", async () => {
    let refreshed = false;
    const bodies: string[] = [];
    const fetch = vi.fn(async (input: RequestInfo | URL) => {
      if (urlOf(input).endsWith("/auth/refresh")) {
        await Promise.resolve();
        refreshed = true;
        return new Response(null, { status: 204 });
      }
      const request = input as Request;
      expect(request.credentials).toBe("same-origin");
      bodies.push(await request.text());
      return new Response(null, { status: refreshed ? 201 : 401 });
    });
    vi.stubGlobal("fetch", fetch);
    const responses = await Promise.all([1, 2].map(id => authFetch("/api/v1/records", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }),
    })));
    expect(responses.map(response => response.status)).toEqual([201, 201]);
    expect(fetch.mock.calls.filter(([input]) => urlOf(input).endsWith("/auth/refresh"))).toHaveLength(1);
    expect(bodies.sort()).toEqual(['{"id":1}', '{"id":1}', '{"id":2}', '{"id":2}']);
  });

  it("surfaces signed out after a second 401 without looping", async () => {
    const fetch = vi.fn(async (input: RequestInfo | URL) => new Response(null, {
      status: urlOf(input).endsWith("/refresh") ? 204 : 401,
    }));
    vi.stubGlobal("fetch", fetch);
    await expect(authFetch("/api/v1/auth/me")).rejects.toBeInstanceOf(SignedOutError);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("preserves a refresh throttle response instead of treating it as logout", async () => {
    const fetch = vi.fn().mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 429 }));
    vi.stubGlobal("fetch", fetch);
    expect((await authFetch("/api/v1/records")).status).toBe(429);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("does not refresh a rejected password or retry a forbidden operation", async () => {
    const fetch = vi.fn().mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 403 }));
    vi.stubGlobal("fetch", fetch);
    expect((await authFetch("/api/v1/auth/login", { method: "POST" })).status).toBe(401);
    expect((await authFetch("/api/v1/records")).status).toBe(403);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("rejects an external destination before sending credentials", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    await expect(authFetch("https://evil.test/api/v1/auth/me")).rejects.toThrow();
    expect(fetch).not.toHaveBeenCalled();
  });
});
