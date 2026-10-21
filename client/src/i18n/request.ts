import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

/**
 * Hands one language's catalogs to the render, server-side.
 *
 * The requested locale comes from the path prefix the proxy resolved. An unknown
 * or missing value falls back to the default locale rather than throwing, because
 * an unresolvable locale is a redirect the proxy already handles, not a reason to
 * fail a page.
 *
 * The imports are written out one per namespace rather than looped. A bundler has
 * to see each catalog path statically to include it; a computed path would be a
 * runtime lookup that fails in a production build. Adding a namespace means adding
 * a line here and a file in each `messages/<locale>/` directory.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const [
    auth,
    metadata,
    switcher,
    boot,
    shell,
    landing,
    site,
    meta,
    files,
    mail,
    word,
    browser,
    reader,
  ] = await Promise.all([
    import(`../../messages/${locale}/auth.json`),
    import(`../../messages/${locale}/metadata.json`),
    import(`../../messages/${locale}/switcher.json`),
    import(`../../messages/${locale}/boot.json`),
    import(`../../messages/${locale}/shell.json`),
    import(`../../messages/${locale}/landing.json`),
    import(`../../messages/${locale}/site.json`),
    import(`../../messages/${locale}/meta.json`),
    import(`../../messages/${locale}/files.json`),
    import(`../../messages/${locale}/mail.json`),
    import(`../../messages/${locale}/word.json`),
    import(`../../messages/${locale}/browser.json`),
    import(`../../messages/${locale}/reader.json`),
  ]);

  return {
    locale,
    messages: {
      auth: auth.default,
      metadata: metadata.default,
      switcher: switcher.default,
      boot: boot.default,
      shell: shell.default,
      landing: landing.default,
      site: site.default,
      meta: meta.default,
      files: files.default,
      mail: mail.default,
      word: word.default,
      browser: browser.default,
      reader: reader.default,
    },
  };
});
