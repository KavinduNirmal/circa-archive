import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArchiveRecord } from "@/components/archive-site/archive-record";
import { SITE_INDEX } from "@/components/archive-site/archive-data";
import { ARCHIVE_INDEX } from "@/components/browser/archive-index";

type RecordPageProps = Readonly<{ params: Promise<{ lang: string; code: string }> }>;

/** Every released code is prerendered in both languages; anything else is a 404. */
export function generateStaticParams() {
  return ARCHIVE_INDEX.map((entry) => ({ code: entry.code }));
}

export async function generateMetadata({ params }: RecordPageProps): Promise<Metadata> {
  const { lang, code } = await params;
  const entry = SITE_INDEX.find((item) => item.code === code);
  if (!entry) return {};
  const [metadata, site] = await Promise.all([
    getTranslations({ locale: lang, namespace: "metadata" }),
    getTranslations({ locale: lang, namespace: "site" }),
  ]);
  const name = entry.designation ?? site("withheldDesignation");
  return {
    title: { absolute: `${name} · ${entry.code} | ${site("homeTitle")}` },
    description: entry.abstract,
    openGraph: {
      type: "article",
      siteName: metadata("registryName"),
      title: `${name} · ${entry.code}`,
      description: entry.abstract,
    },
  };
}

export default async function RecordPage({ params }: RecordPageProps) {
  const { lang, code } = await params;
  setRequestLocale(lang);
  return <ArchiveRecord code={code} />;
}
