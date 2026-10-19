import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import proxy from "@/proxy";

vi.mock("server-only", () => ({}));

const jwt = (expires: number) => `header.${Buffer.from(JSON.stringify({ exp: expires })).toString("base64url")}.signature`;
const pageRequest = (access?: string) => new NextRequest("http://localhost:3001/ko/site", {
  headers: { cookie: `NEXT_LOCALE=ko; circa_rt=refresh-old${access ? `; circa_at=${access}` : ""}` },
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("navigation session refresh", () => {
  it("refreshes a missing access cookie and forwards cookies to the browser and current render", async () => {
    vi.stubEnv("API_ORIGIN", "http://localhost:5040");
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204, headers: [
      ["set-cookie", "circa_at=fresh; Path=/; HttpOnly; SameSite=Lax"],
      ["set-cookie", "circa_rt=rotated; Path=/; HttpOnly; SameSite=Strict"],
    ] }));
    vi.stubGlobal("fetch", fetch);
    const response = await proxy(pageRequest());
    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch.mock.calls[0][0]).toBe("http://localhost:5040/api/v1/auth/refresh");
    expect(new Headers(fetch.mock.calls[0][1].headers).get("cookie")).toContain("circa_rt=refresh-old");
    expect(response.cookies.get("circa_at")?.value).toBe("fresh");
    expect(response.cookies.get("circa_rt")?.value).toBe("rotated");
    expect(response.headers.get("x-middleware-request-cookie")).toContain("circa_at=fresh");
    expect(response.headers.get("x-middleware-request-cookie")).toContain("NEXT_LOCALE=ko");
    expect(response.headers.get("location")).toBeNull();
  });

  it("refreshes within 120 seconds and keeps the locale redirect", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    const request = pageRequest(jwt(Math.floor(Date.now() / 1000) + 60));
    request.nextUrl.pathname = "/site";
    const response = await proxy(request);
    expect(fetch).toHaveBeenCalledOnce();
    expect(response.headers.get("location")).toMatch(/\/ko\/site$/);
  });

  it("leaves fresh access cookies and anonymous visits alone", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    await proxy(pageRequest(jwt(Math.floor(Date.now() / 1000) + 500)));
    await proxy(new NextRequest("http://localhost:3001/en/site"));
    expect(fetch).not.toHaveBeenCalled();
  });

  it("propagates cookie clearing after an expired session", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 401, headers: [
      ["set-cookie", "circa_at=; Path=/; Max-Age=0; HttpOnly"],
      ["set-cookie", "circa_rt=; Path=/; Max-Age=0; HttpOnly"],
    ] })));
    const response = await proxy(pageRequest());
    expect(response.cookies.get("circa_rt")?.maxAge).toBe(0);
    expect(response.headers.get("x-middleware-request-cookie")).not.toContain("circa_rt=");
  });

  it("keeps public navigation working during an API outage", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    expect((await proxy(pageRequest())).status).toBe(200);
  });
});
