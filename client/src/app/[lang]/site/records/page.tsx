import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArchiveRecords } from "@/components/archive-site/archive-records";
import { routing } from "@/i18n/routing";

type RecordsPageProps = Readonly<{
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ q?: string | string[] }>;
}>;

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: RecordsPageProps): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: "metadata" });
  return { title: { absolute: t("siteRecordsTitle") }, description: t("siteRecordsDescription") };
}

export default async function RecordsPage({ params, searchParams }: RecordsPageProps) {
  const { lang } = await params;
  const { q } = await searchParams;
  setRequestLocale(lang);
  return <ArchiveRecords query={typeof q === "string" ? q : ""} />;
}
