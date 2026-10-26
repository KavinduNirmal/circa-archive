import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArchiveRecordType } from "@/components/archive-site/archive-record-type";
import { routing } from "@/i18n/routing";

type EvidencePageProps = Readonly<{ params: Promise<{ lang: string }> }>;

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: EvidencePageProps): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: "metadata" });
  return {
    title: { absolute: t("siteEvidenceTitle") },
    description: t("siteEvidenceDescription"),
  };
}

export default async function EvidencePage({ params }: EvidencePageProps) {
  const { lang } = await params;
  setRequestLocale(lang);
  return <ArchiveRecordType kind="evidence" />;
}
