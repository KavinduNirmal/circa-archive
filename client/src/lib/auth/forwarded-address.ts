import "server-only";
import { isIP } from "node:net";

/** Enable only when an ingress overwrites these headers and Next is not directly exposed. */
export function trustedProxyHeaders(
  incoming: Pick<Headers, "get">,
): Record<string, string> {
  if (process.env.TRUST_PROXY_HEADERS !== "true") return {};
  const address = incoming.get("x-forwarded-for")?.trim();
  if (!address || !isIP(address)) return {};
  const headers: Record<string, string> = { "X-Forwarded-For": address };
  const protocol = incoming.get("x-forwarded-proto");
  if (protocol === "http" || protocol === "https")
    headers["X-Forwarded-Proto"] = protocol;
  return headers;
}
