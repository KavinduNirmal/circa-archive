let refreshInFlight: Promise<Response> | undefined;
let refreshGeneration = 0;

export class SignedOutError extends Error {
  readonly code = "signed_out";

  constructor() {
    super("signed_out");
    this.name = "SignedOutError";
  }
}

/** Cookie transport only. Callers translate SignedOutError.code for their UI. */
export async function authFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = new URL(path, window.location.origin);
  if (url.origin !== window.location.origin || !url.pathname.startsWith("/api/")) {
    throw new TypeError("Auth requests require a same-origin API path");
  }
  const request = new Request(url, { ...init, credentials: "same-origin" });
  const retry = request.clone();
  const generation = refreshGeneration;
  const response = await fetch(request);
  const isCredentialOperation = /^\/api\/v1\/auth\/(login|register|refresh|logout)$/.test(url.pathname);
  if (response.status !== 401 || isCredentialOperation) return response;

  if (generation === refreshGeneration) {
    refreshInFlight ??= fetch("/api/v1/auth/refresh", {
      method: "POST", credentials: "same-origin",
    }).then(result => {
      if (result.ok) refreshGeneration++;
      return result;
    }).finally(() => { refreshInFlight = undefined; });
    // A cancelled caller must not cancel the shared refresh for other requests.
    const refresh = await refreshInFlight;
    if (refresh.status === 401) throw new SignedOutError();
    if (!refresh.ok) return refresh.clone();
  }
  const result = await fetch(retry);
  if (result.status === 401) throw new SignedOutError();
  return result;
}
