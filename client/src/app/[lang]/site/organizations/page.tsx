import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArchiveOrganizations } from "@/components/archive-site/archive-organizations";
import { routing } from "@/i18n/routing";

type OrganizationsPageProps = Readonly<{
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ q?: string | string[] }>;
}>;

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: OrganizationsPageProps): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: "metadata" });
  return { title: { absolute: t("siteOrganizationsTitle") }, description: t("siteOrganizationsDescription") };
}

/** The first value of a repeated parameter, or an empty string. */
function first(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function OrganizationsPage({ params, searchParams }: OrganizationsPageProps) {
  const { lang } = await params;
  const { q } = await searchParams;
  setRequestLocale(lang);
  return <ArchiveOrganizations query={first(q)} />;
}
