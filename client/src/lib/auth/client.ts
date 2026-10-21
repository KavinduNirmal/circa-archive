import type {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { createApiTransport, requestOptions, webResponse } from "./transport";

let browserApi: AxiosInstance | undefined;
let refreshInFlight: Promise<AxiosResponse<string>> | undefined;
let refreshGeneration = 0;
type AuthRequest = InternalAxiosRequestConfig & {
  authGeneration?: number;
  authRetried?: boolean;
};
const credentialOperation =
  /\/api\/v1\/auth\/(login|register|refresh|logout)\/?$/;

export class SignedOutError extends Error {
  readonly code = "signed_out";

  constructor() {
    super("signed_out");
    this.name = "SignedOutError";
  }
}

function getBrowserApi() {
  if (browserApi) return browserApi;
  const api = createApiTransport(window.location.origin);
  api.interceptors.request.use((config: AuthRequest) => {
    config.withCredentials = true;
    config.authGeneration ??= refreshGeneration;
    return config;
  });
  api.interceptors.request.use((config) => {
    // A browser cannot attest its IP. The ingress supplies it from the socket.
    for (const header of [
      "X-Forwarded-For",
      "X-Real-IP",
      "Forwarded",
      "X-Forwarded-Proto",
    ])
      config.headers.delete(header);
    return config;
  });
  api.interceptors.response.use(async (response: AxiosResponse<string>) => {
    const config = response.config as AuthRequest;
    if (
      response.status !== 401 ||
      credentialOperation.test(
        new URL(config.url!, window.location.origin).pathname,
      )
    )
      return response;
    if (config.authRetried) throw new SignedOutError();
    if (config.authGeneration === refreshGeneration) {
      refreshInFlight ??= api
        .post<string>("/api/v1/auth/refresh", undefined, { timeout: 5000 })
        .then((result) => {
          if (result.status >= 200 && result.status < 300) refreshGeneration++;
          return result;
        })
        .finally(() => {
          refreshInFlight = undefined;
        });
      // Shared refresh does not inherit an individual caller's cancellation.
      const refreshed = await refreshInFlight;
      if (refreshed.status === 401) throw new SignedOutError();
      if (refreshed.status < 200 || refreshed.status >= 300) return refreshed;
    }
    config.authRetried = true;
    return api.request<string>(config);
  });
  browserApi = api;
  return api;
}

/** Axios interceptors own cookie auth, address-header stripping, and one shared refresh. */
export async function authFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  return webResponse(
    await getBrowserApi().request<string>(requestOptions(path, init)),
  );
}
