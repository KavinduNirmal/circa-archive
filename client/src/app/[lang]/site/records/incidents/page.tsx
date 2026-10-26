import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArchiveRecordType } from "@/components/archive-site/archive-record-type";
import { routing } from "@/i18n/routing";

type IncidentsPageProps = Readonly<{ params: Promise<{ lang: string }> }>;

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: IncidentsPageProps): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: "metadata" });
  return {
    title: { absolute: t("siteIncidentsTitle") },
    description: t("siteIncidentsDescription"),
  };
}

export default async function IncidentsPage({ params }: IncidentsPageProps) {
  const { lang } = await params;
  setRequestLocale(lang);
  return <ArchiveRecordType kind="incidents" />;
}
