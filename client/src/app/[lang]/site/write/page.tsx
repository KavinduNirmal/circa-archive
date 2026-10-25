import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import type { AbstractIntlMessages } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { ArchiveChrome } from "@/components/archive-site/archive-chrome";
import { ArchiveWrite } from "@/components/archive-site/archive-write";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ lang: string }> };
export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: "site" });
  return { title: t("writeTitle"), description: t("writeIntro") };
}
export default async function WritePage({ params }: Props) {
  const { lang } = await params;
  setRequestLocale(lang);
  const t = await getTranslations("site");
  /*
   * The writing desk is the one public screen with a client island. The layout
   * keeps the `site` catalog off the browser, so hand this route's copy to the
   * island deliberately rather than expanding what every page ships.
   */
  const messages = await getMessages();
  const site = messages.site as AbstractIntlMessages;
  return (
    <ArchiveChrome active="editor" trail={[{ label: t("writeTitle") }]}>
      <NextIntlClientProvider locale={lang} messages={{ site }}>
        <ArchiveWrite />
      </NextIntlClientProvider>
    </ArchiveChrome>
  );
}
