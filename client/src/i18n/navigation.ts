import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * Locale-aware replacements for `next/link` and `next/navigation`.
 *
 * A link written with these keeps the reader's current language without every
 * call site repeating it, so `/desktop` means `/ko/desktop` for a Korean reader
 * and `/en/desktop` for an English one. Import these instead of the Next.js
 * originals anywhere a destination is built; a raw `next/link` would silently
 * drop the prefix and bounce the reader through the proxy redirect.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
