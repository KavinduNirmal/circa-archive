import "server-only";
import { unstable_rethrow } from "next/navigation";
import { cache } from "react";
import { cookies } from "next/headers";
import { apiOrigin } from "./server";

export interface Account {
  id: string;
  username: string;
  role: "author" | "moderator";
  createdAt: string;
}

/** Read-only server requests. Cookie mutation belongs to proxy or browser API calls. */
export async function sessionFetch(path: string, init?: RequestInit): Promise<Response> {
  const origin = apiOrigin();
  const url = new URL(path, origin);
  if (url.origin !== origin || !url.pathname.startsWith("/api/")) {
    throw new TypeError("Session requests require an API path on the configured origin");
  }
  const headers = new Headers(init?.headers);
  headers.set("Cookie", (await cookies()).toString());
  return fetch(url, { ...init, headers, cache: "no-store", redirect: "manual", signal: init?.signal ?? AbortSignal.timeout(5000) });
}

export type SessionState = { status: "authenticated"; account: Account } | { status: "guest" | "unavailable" };

export const getSession = cache(async (): Promise<Account | null> => {
  const credentials = await cookies();
  if (!credentials.has("circa_at")) {
    // Proxy clears the refresh cookie after a definitive 401. A surviving cookie
    // means refresh could not complete, rather than that the reader signed out.
    if (credentials.has("circa_rt")) throw new Error("Session refresh unavailable");
    return null;
  }
  const response = await sessionFetch("/api/v1/auth/me");
  if (response.status === 401) return null;
  if (!response.ok) throw new Error(`Session lookup failed (${response.status})`);
  return response.json() as Promise<Account>;
});

export async function getSessionState(): Promise<SessionState> {
  try {
    const account = await getSession();
    return account ? { status: "authenticated", account } : { status: "guest" };
  } catch (error) {
    unstable_rethrow(error);
    return { status: "unavailable" };
  }
}
