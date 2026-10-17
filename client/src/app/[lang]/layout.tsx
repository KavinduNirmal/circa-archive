import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/dm-sans/700.css";
import "@fontsource/ibm-plex-mono/400.css";
import { routing } from "@/i18n/routing";
import "../globals.css";

/**
 * The document shell, now per language.
 *
 * This is the root layout: every route lives under a language segment, so the
 * `lang` attribute, the title, and the message catalog all come from the one
 * segment the proxy resolved. `generateStaticParams` lets both languages be
 * built ahead of time, and `setRequestLocale` is what tells next-intl which one
 * a given build is for.
 */
type LanguageLayoutProps = Readonly<{ children: React.ReactNode; params: Promise<{ lang: string }> }>;

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LanguageLayoutProps): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: "metadata" });
  return { title: t("rootTitle"), description: t("rootDescription") };
}

export default async function LanguageLayout({ children, params }: LanguageLayoutProps) {
  const { lang } = await params;
  // A segment that is not one of our languages is a 404, not a silent English page.
  if (!hasLocale(routing.locales, lang)) notFound();
  setRequestLocale(lang);

  const messages = await getMessages();

  /*
   * Everything except the public pages' prose crosses to the browser. `landing`
   * and `site` are rendered on the server — the agency portal and the public
   * archive — so leaving them out is what keeps those pages out of the client
   * bundle. Every other namespace is read by a client component somewhere in the
   * workstation, so listing them individually would only be a list to forget.
   */
  const clientMessages: typeof messages = {};
  for (const [namespace, catalog] of Object.entries(messages)) {
    if (namespace !== "landing" && namespace !== "site" && namespace !== "meta") clientMessages[namespace] = catalog;
  }

  return (
    <html lang={lang} className="dark">
      <body>
        <NextIntlClientProvider locale={lang} messages={clientMessages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
