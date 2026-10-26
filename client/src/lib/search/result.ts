import type { SearchResultItem } from "./fixture";

/** Map an API result to the public destination that is available in phase one. */
export function searchResultHref(item: SearchResultItem): string | null {
  if (item.type === "organization" && item.code) {
    return `/site/organizations?q=${encodeURIComponent(item.code)}`;
  }
  if (item.type === "character" && item.code) {
    return `/site/characters/${encodeURIComponent(item.code)}`;
  }
  if (item.type === "recovery" && item.code) {
    return `/site/recoveries/${encodeURIComponent(item.code)}`;
  }
  if ((item.type === "incident" || item.type === "record") && item.code) {
    return `/site/records/${encodeURIComponent(item.code)}`;
  }
  if (item.type === "record" && item.parent && item.referenceNumber !== null) {
    return `/site/records/${encodeURIComponent(item.parent.code)}?tab=rumours#rumour-${item.referenceNumber}`;
  }
  return null;
}
