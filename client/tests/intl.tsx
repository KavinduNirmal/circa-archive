import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { NextIntlClientProvider, createTranslator } from "next-intl";
import type { AbstractIntlMessages } from "next-intl";
import { render, type RenderOptions } from "@testing-library/react";

/**
 * Client components read their copy from `NextIntlClientProvider`, so a test that
 * renders one without the provider is asserting on a crash rather than on the
 * interface. These helpers wrap a subject the way `[lang]/layout.tsx` does.
 *
 * The catalogs used here are the ones the app actually ships, so a test asserts
 * the sentence a reader sees rather than a message key. A test that asserted keys
 * would keep passing while every translation was wrong.
 *
 * Catalog paths resolve from the working directory, not from `import.meta.url`:
 * under the jsdom environment that URL is not a file URL. The test scripts are run
 * from `client/`, which is where `messages/` sits.
 */

export type TestLocale = "en" | "ko";

const catalogRoot = resolve(process.cwd(), "messages");

/** A namespace's catalog: every namespace in this project is a flat key/value map. */
export type NamespaceCatalog = Record<string, string>;
export type TestCatalog = Record<string, NamespaceCatalog>;

function readCatalog(locale: TestLocale): TestCatalog {
  const catalog: TestCatalog = {};
  for (const file of readdirSync(`${catalogRoot}/${locale}`)) {
    if (!file.endsWith(".json")) continue;
    catalog[file.replace(/\.json$/, "")] = JSON.parse(readFileSync(`${catalogRoot}/${locale}/${file}`, "utf8"));
  }
  return catalog;
}

const catalogs: Record<TestLocale, TestCatalog> = { en: readCatalog("en"), ko: readCatalog("ko") };

export function catalogFor(locale: TestLocale): TestCatalog {
  return catalogs[locale];
}

/**
 * The catalog handed to a rendered subject.
 *
 * The production layout narrows this to everything but the portal's server-rendered
 * prose. The test runner has no server pass, so a page component rendered here
 * reads its copy the way a client component does and needs the whole catalog.
 */
export function clientMessages(locale: TestLocale): AbstractIntlMessages {
  return catalogFor(locale) as unknown as AbstractIntlMessages;
}

export function IntlProvider({ locale = "en", children }: { locale?: TestLocale; children: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale={locale} messages={clientMessages(locale)}>
      {children}
    </NextIntlClientProvider>
  );
}

/** `render`, with the message provider wrapped around the subject. */
export function renderWithIntl(ui: React.ReactElement, options: RenderOptions & { locale?: TestLocale } = {}) {
  const { locale = "en", ...rest } = options;
  return render(ui, {
    wrapper: ({ children }) => <IntlProvider locale={locale}>{children}</IntlProvider>,
    ...rest,
  });
}

/**
 * A translator for the helpers that take one instead of a hook, such as
 * `bootLines`, which builds the post screen's lines outside React.
 *
 * `namespace` is a runtime string here, so it is cast past the literal-union type
 * next-intl infers from the catalog; the returned translator is narrowed to the
 * plain call shape the helpers declare.
 */
export function translatorFor(namespace: string, locale: TestLocale = "en") {
  return createTranslator({
    locale,
    messages: clientMessages(locale),
    namespace: namespace as never,
  }) as unknown as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
}
