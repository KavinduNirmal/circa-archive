import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArchiveHome } from "@/components/archive-site/archive-home";
import { routing } from "@/i18n/routing";

type SitePageProps = Readonly<{ params: Promise<{ lang: string }> }>;

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: SitePageProps): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: "metadata" });
  return { title: { absolute: t("siteHomeTitle") }, description: t("siteHomeDescription") };
}

/** The public archive's front page: a plain page, in the reader's own language. */
export default async function PublicArchivePage({ params }: SitePageProps) {
  const { lang } = await params;
  setRequestLocale(lang);
  return <ArchiveHome />;
}
