import "server-only";

/** Trusted deployment configuration, never derived from an inbound Host header. */
export function apiOrigin(): string {
  const origin = process.env.API_ORIGIN ?? (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test"
    ? "http://localhost:5040" : undefined);
  if (!origin) throw new Error("API_ORIGIN is required for server authentication");
  const url = new URL(origin);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("API_ORIGIN must be an HTTP origin without credentials or a path");
  }
  return url.origin;
}
