import "server-only";
import { unstable_rethrow } from "next/navigation";
import { cache } from "react";
import { cookies, headers as requestHeaders } from "next/headers";
import { createApiTransport, requestOptions, webResponse } from "./transport";
import { trustedProxyHeaders } from "./forwarded-address";
import { apiOrigin } from "./server";

export interface Account {
  id: string;
  username: string;
  role: "author" | "moderator";
  createdAt: string;
  displayId: string;
  displayName: string;
  displayEmail: string;
  adoptedOrganizationId: string | null;
}

/** Read-only server requests. Cookie mutation belongs to proxy or browser API calls. */
export async function sessionFetch(path: string, init?: RequestInit): Promise<Response> {
  const api = createApiTransport(apiOrigin());
  const cookie = (await cookies()).toString();
  const forwarded = trustedProxyHeaders(await requestHeaders());
  api.interceptors.request.use(config => {
    config.headers.set("Cookie", cookie);
    return config;
  });
  api.interceptors.request.use(config => {
    for (const name of ["X-Forwarded-For", "X-Real-IP", "Forwarded", "X-Forwarded-Proto"]) config.headers.delete(name);
    for (const [name, value] of Object.entries(forwarded)) config.headers.set(name, value);
    return config;
  });
  const response = await api.request<string>({ ...requestOptions(path, init), timeout: 5000 });
  return webResponse(response);
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
