import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { NextIntlClientProvider, createTranslator } from "next-intl";
import type { AbstractIntlMessages } from "next-intl";
import { render, type RenderOptions } from "@testing-library/react";
import { createWorkstationStore, type WorkstationStoreApi } from "@/stores/workstation-store";
import { WorkstationStoreProvider } from "@/stores/workstation-store-provider";

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
 * The wrapper a workstation subject needs: messages plus its own store.
 *
 * The shell reads windows, the reader trail, the screen preference, and the
 * measured area from the store, so a test that rendered it without a provider
 * would be asserting on a crash. A store can be injected to assert on or drive
 * the exact state the shell is showing.
 */
export function workstationWrapper(options: { locale?: TestLocale; store?: WorkstationStoreApi } = {}) {
  // Each wrapper gets its own plain store unless one is injected, so tests never
  // share a workspace (or a storage key) by accident.
  const { locale = "en", store = createWorkstationStore() } = options;
  function WorkstationTestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <IntlProvider locale={locale}>
        <WorkstationStoreProvider store={store}>{children}</WorkstationStoreProvider>
      </IntlProvider>
    );
  }
  return WorkstationTestWrapper;
}

/** `renderWorkstation` for the shell; `renderWithIntl` stays store-free for single components. */
export function renderWorkstation(
  ui: React.ReactElement,
  options: RenderOptions & { locale?: TestLocale; store?: WorkstationStoreApi } = {},
) {
  const { locale = "en", store = createWorkstationStore(), ...rest } = options;
  return render(ui, { wrapper: workstationWrapper({ locale, store }), ...rest });
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
