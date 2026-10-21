import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArchiveAbout } from "@/components/archive-site/archive-about";
import { routing } from "@/i18n/routing";

type AboutPageProps = Readonly<{ params: Promise<{ lang: string }> }>;

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: AboutPageProps): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: "metadata" });
  return {
    title: { absolute: t("siteAboutTitle") },
    description: t("siteAboutDescription"),
  };
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { lang } = await params;
  setRequestLocale(lang);
  return <ArchiveAbout />;
}
