import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArchiveExplorations } from "@/components/archive-site/archive-explorations";
import { SITE_INDEX } from "@/components/archive-site/archive-data";
import { explorationsFor } from "@/components/reader/reader-correspondence";

type ExplorationsPageProps = Readonly<{
  params: Promise<{ lang: string; code: string }>;
}>;

/**
 * Only records that actually have explorations are prerendered. The count in a
 * record's status bar is the only link to this page, so a code with no list has
 * no address worth generating; a direct visit still resolves to a 404.
 */
export function generateStaticParams() {
  return SITE_INDEX.filter(
    (entry) => explorationsFor(entry.code).length > 0,
  ).map((entry) => ({ code: entry.code }));
}

export async function generateMetadata({
  params,
}: ExplorationsPageProps): Promise<Metadata> {
  const { lang, code } = await params;
  if (
    !SITE_INDEX.some((entry) => entry.code === code) ||
    explorationsFor(code).length === 0
  )
    return {};
  const [metadata, site] = await Promise.all([
    getTranslations({ locale: lang, namespace: "metadata" }),
    getTranslations({ locale: lang, namespace: "site" }),
  ]);
  const title = site("explorationsMetaTitle", { code });
  const description = site("explorationsMetaDescription", { code });
  return {
    title: { absolute: `${title} | ${site("homeTitle")}` },
    description,
    openGraph: {
      type: "article",
      siteName: metadata("registryName"),
      title,
      description,
    },
  };
}

export default async function ExplorationsPage({
  params,
}: ExplorationsPageProps) {
  const { lang, code } = await params;
  setRequestLocale(lang);
  return <ArchiveExplorations code={code} />;
}
