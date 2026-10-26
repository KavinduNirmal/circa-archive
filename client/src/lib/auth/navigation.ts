import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { trustedProxyHeaders } from "./forwarded-address";
import { apiOrigin } from "./server";

function needsRefresh(token: string | undefined): boolean {
  if (!token) return true;
  try {
    // Expiry is only a scheduling hint. The API validates signatures and permissions.
    const { exp } = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString("utf8"),
    );
    return (
      typeof exp !== "number" ||
      !Number.isFinite(exp) ||
      exp <= Date.now() / 1000 + 120
    );
  } catch {
    return true;
  }
}

export async function refreshNavigation(
  request: NextRequest,
  response: NextResponse,
): Promise<NextResponse> {
  if (
    !request.cookies.has("circa_rt") ||
    !needsRefresh(request.cookies.get("circa_at")?.value)
  )
    return response;
  try {
    const refreshed = await fetch(`${apiOrigin()}/api/v1/auth/refresh`, {
      method: "POST",
      headers: {
        ...trustedProxyHeaders(request.headers),
        Cookie: request.headers.get("cookie") ?? "",
        // This is a server-to-server call, not a browser mutation. nextUrl.origin
        // reflects the bind address (for example http://0.0.0.0:3001), not the
        // public origin the API allows, so asserting it here would fail CSRF
        // origin validation and strand a valid refresh cookie as unavailable.
      },
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(5000),
    });
    if (!refreshed.ok && refreshed.status !== 401) return response;
    const cookieHeaders = refreshed.headers.getSetCookie();
    // Parse each Set-Cookie independently; Expires contains commas.
    const headers = new Headers();
    for (const header of cookieHeaders) headers.append("set-cookie", header);
    const cookieResponse = new NextResponse(null, { headers });
    for (const cookie of cookieResponse.cookies.getAll()) {
      if (cookie.name !== "circa_at" && cookie.name !== "circa_rt") continue;
      // Next's cookie parser drops numeric zero; retain deletion semantics explicitly.
      const raw = cookieHeaders.find((header) =>
        header.startsWith(`${cookie.name}=`),
      );
      if (raw && /;\s*max-age=0(?:;|$)/i.test(raw)) cookie.maxAge = 0;
      response.cookies.set(cookie);
      if (
        !cookie.value ||
        cookie.maxAge === 0 ||
        (cookie.expires && +cookie.expires <= Date.now())
      ) {
        request.cookies.delete(cookie.name);
      } else {
        request.cookies.set(cookie.name, cookie.value);
      }
    }
    if (cookieHeaders.length) {
      // The Server Component render must see the fresh credentials on this request too.
      const overrides = new Set(
        (response.headers.get("x-middleware-override-headers") ?? "")
          .split(",")
          .filter(Boolean),
      );
      overrides.add("cookie");
      response.headers.set(
        "x-middleware-override-headers",
        [...overrides].join(","),
      );
      response.headers.set(
        "x-middleware-request-cookie",
        request.headers.get("cookie") ?? "",
      );
    }
  } catch {
    // Public pages remain available during API outages. A failed refresh grants no access.
  }
  return response;
}
