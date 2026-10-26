import {
  parseSearchState,
  toSearchParams,
  type SearchParamsInput,
} from "./query";

/** Rebuild untrusted stored URLs using fixed routes and encoded known parameters. */
export function savedSearchHref(value: unknown, origin: string): string | null {
  if (typeof value !== "string" || value.length > 4096) return null;
  try {
    const url = new URL(value, origin);
    if (
      url.origin !== origin ||
      url.username ||
      url.password ||
      !["http:", "https:"].includes(url.protocol)
    )
      return null;
    const path =
      url.pathname === "/en/site/records"
        ? "/en/site/records"
        : url.pathname === "/ko/site/records"
          ? "/ko/site/records"
          : null;
    if (!path) return null;
    const input: SearchParamsInput = Object.create(null);
    for (const key of new Set(url.searchParams.keys()))
      input[key] = url.searchParams.getAll(key);
    const query = toSearchParams(parseSearchState(input)).toString();
    return query ? `${path}?${query}` : path;
  } catch {
    return null;
  }
}
