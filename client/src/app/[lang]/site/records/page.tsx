import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  ARCHIVE_CLASSES,
  ARCHIVE_PERIODS,
  ARCHIVE_STATUSES,
  type ArchiveClass,
  type ArchivePeriod,
  type ArchiveStatus,
} from "@/components/browser/archive-index";
import { ArchiveRecords } from "@/components/archive-site/archive-records";
import { routing } from "@/i18n/routing";

type RecordsPageProps = Readonly<{
  params: Promise<{ lang: string }>;
  searchParams: Promise<{
    q?: string | string[];
    class?: string | string[];
    status?: string | string[];
    period?: string | string[];
  }>;
}>;

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: RecordsPageProps): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: "metadata" });
  return {
    title: { absolute: t("siteRecordsTitle") },
    description: t("siteRecordsDescription"),
  };
}

/** The first value of a repeated parameter, or an empty string. */
function first(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/**
 * Keep a parameter only when it names something the index knows.
 *
 * The address is the state, so it is also the input: a hand-edited or truncated
 * `?class=` must resolve to "all" rather than to an empty table nobody can
 * explain, and the same guard keeps `searchArchive` from being handed a class it
 * has no branch for.
 */
function pick<T extends string>(
  allowed: readonly string[],
  value: string,
  fallback: T,
): T {
  return (allowed.includes(value) ? value : fallback) as T;
}

export default async function RecordsPage({
  params,
  searchParams,
}: RecordsPageProps) {
  const { lang } = await params;
  const { q, class: klassParam, status, period } = await searchParams;
  setRequestLocale(lang);
  return (
    <ArchiveRecords
      query={first(q)}
      klass={pick<ArchiveClass | "all">(
        ["all", ...ARCHIVE_CLASSES],
        first(klassParam),
        "all",
      )}
      status={pick<ArchiveStatus | "all">(
        ["all", ...ARCHIVE_STATUSES],
        first(status),
        "all",
      )}
      period={pick<ArchivePeriod>(ARCHIVE_PERIODS, first(period), "any")}
    />
  );
}
