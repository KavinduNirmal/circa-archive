import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArchiveRecordType } from "@/components/archive-site/archive-record-type";
import { routing } from "@/i18n/routing";

type ExplorationsPageProps = Readonly<{ params: Promise<{ lang: string }> }>;

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: ExplorationsPageProps): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: "metadata" });
  return {
    title: { absolute: t("siteExplorationsTitle") },
    description: t("siteExplorationsDescription"),
  };
}

export default async function ExplorationsPage({
  params,
}: ExplorationsPageProps) {
  const { lang } = await params;
  setRequestLocale(lang);
  return <ArchiveRecordType kind="explorations" />;
}
