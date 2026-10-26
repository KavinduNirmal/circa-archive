import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArchiveRecordType } from "@/components/archive-site/archive-record-type";
import { routing } from "@/i18n/routing";

type RumoursPageProps = Readonly<{ params: Promise<{ lang: string }> }>;

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: RumoursPageProps): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: "metadata" });
  return {
    title: { absolute: t("siteRumoursTitle") },
    description: t("siteRumoursDescription"),
  };
}

export default async function RumoursPage({ params }: RumoursPageProps) {
  const { lang } = await params;
  setRequestLocale(lang);
  return <ArchiveRecordType kind="rumours" />;
}
