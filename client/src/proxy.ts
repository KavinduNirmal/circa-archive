import type { NextRequest } from "next/server";
import { refreshNavigation } from "./lib/auth/navigation";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

/**
 * Resolves the language for an incoming request and redirects a bare path to it.
 *
 * This is the only place the product decides which language a reader sees, and
 * the order is deliberate: an explicit `/ko/...` prefix wins, then the
 * `NEXT_LOCALE` cookie a previous visit set, then the browser's own
 * `Accept-Language`, then English. The cookie is what makes the language
 * switcher stick; without it a reader who chose Korean would be sent back to
 * their browser's language on the next visit.
 *
 * Note for anyone reaching for the older name: Next.js 16 renamed this file
 * convention from `middleware.ts` to `proxy.ts`, and the middleware export to
 * `proxy`. The default export below is that function.
 */
const resolveLocale = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  const response = resolveLocale(request);
  return refreshNavigation(request, response);
}

export const config = {
  /**
   * Page requests only. API routes and Next.js internals are left alone, and so
   * is anything with a file extension — the Windows 98 icon bitmaps and the
   * Markdown record fixtures are served as they are, without a locale.
   */
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
