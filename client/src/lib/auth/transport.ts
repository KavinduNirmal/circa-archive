import axios, { type AxiosResponse } from "axios";

/** One origin and /api boundary for both browser and server cookie transports. */
export function createApiTransport(origin: string) {
  const api = axios.create({
    baseURL: origin,
    adapter: "fetch",
    responseType: "text",
    transformResponse: [value => value],
    validateStatus: () => true,
    timeout: 15000,
    fetchOptions: { cache: "no-store", redirect: "manual" },
    // Resolve the platform fetch per call, including request instrumentation.
    env: { fetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init) },
  });
  api.interceptors.request.use(config => {
    const url = new URL(config.url ?? "", origin);
    if (url.origin !== origin || url.username || url.password || !url.pathname.startsWith("/api/")) {
      throw new TypeError("Authentication requires an API path on the configured origin");
    }
    config.url = url.href;
    config.baseURL = origin;
    return config;
  });
  return api;
}

export function requestOptions(path: string, init?: RequestInit) {
  return {
    url: path,
    method: init?.method ?? "GET",
    headers: Object.fromEntries(new Headers(init?.headers)),
    data: init?.body,
    signal: init?.signal ?? undefined,
  };
}

/** Preserve the Web Response contract consumed by forms and Server Components. */
export function webResponse(response: AxiosResponse<string>): Response {
  const headers = new Headers();
  for (const [key, value] of Object.entries(response.headers)) {
    if (value !== undefined && value !== null && value !== false) headers.set(key, String(value));
  }
  return new Response([204, 205, 304].includes(response.status) ? null : response.data || null, {
    status: response.status, statusText: response.statusText, headers,
  });
}
