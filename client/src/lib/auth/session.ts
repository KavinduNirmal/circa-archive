import "server-only";
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
  return fetch(url, { ...init, headers, cache: "no-store", redirect: "manual" });
}

export async function getSession(): Promise<Account | null> {
  const response = await sessionFetch("/api/v1/auth/me");
  if (response.status === 401) return null;
  if (!response.ok) throw new Error(`Session lookup failed (${response.status})`);
  return response.json() as Promise<Account>;
}
