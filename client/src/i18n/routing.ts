import { defineRouting } from "next-intl/routing";

/**
 * The languages the public registry answers in.
 *
 * English stays the default because it is the language the archive's own
 * paperwork is written in, and Korean is offered beside it for the Commission's
 * correspondents in the Republic of Korea. Adding a language means adding it
 * here and adding its catalog under `messages/`; nothing else names a language.
 */
export const locales = ["en", "ko"] as const;

export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: "en",
  /**
   * Every page carries its language, so one document never answers at two
   * addresses. That leaves a bare path free to redirect, which is what lets a
   * reader's browser preference decide where they land without a second copy of
   * the same page being indexed.
   */
  localePrefix: "always",
});
