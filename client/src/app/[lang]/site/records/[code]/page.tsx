import { notFound } from "next/navigation";
import { getArchiveDestination } from "@/lib/search/destination";
import { ArchiveApiRecord } from "@/components/archive-site/archive-api-record";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArchiveRecord } from "@/components/archive-site/archive-record";
import { SITE_INDEX } from "@/components/archive-site/archive-data";

type RecordPageProps = Readonly<{
  params: Promise<{ lang: string; code: string }>;
  searchParams: Promise<{ acknowledge?: string | string[] }>;
}>;

// The data-source flag and approved-reader body must be evaluated per request.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: RecordPageProps): Promise<Metadata> {
  const { lang, code } = await params;
  if (process.env.SEARCH_SOURCE === "api") {
    const result = await getArchiveDestination(code);
    return result.status === "success"
      ? {
          title: `${result.destination.title} · ${result.destination.code}`,
          robots: { index: false, follow: true },
        }
      : {};
  }
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

export default async function RecordPage({
  params,
  searchParams,
}: RecordPageProps) {
  const { lang, code } = await params;
  setRequestLocale(lang);
  if (process.env.SEARCH_SOURCE === "api") {
    const outcome = await getArchiveDestination(
      code,
      (await searchParams).acknowledge === "true",
    );
    if (outcome.status === "missing") notFound();
    if (outcome.status !== "success")
      throw new Error("Archive destination unavailable");
    return <ArchiveApiRecord destination={outcome.destination} />;
  }
  return <ArchiveRecord code={code} />;
}
