import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArchiveOrganizations } from "@/components/archive-site/archive-organizations";
import { routing } from "@/i18n/routing";

type OrganizationsPageProps = Readonly<{ params: Promise<{ lang: string }> }>;

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: OrganizationsPageProps): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: "metadata" });
  return { title: { absolute: t("siteOrganizationsTitle") }, description: t("siteOrganizationsDescription") };
}

export default async function OrganizationsPage({ params }: OrganizationsPageProps) {
  const { lang } = await params;
  setRequestLocale(lang);
  return <ArchiveOrganizations />;
}
