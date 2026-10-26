import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArchiveCharacters } from "@/components/archive-site/archive-characters";
import { routing } from "@/i18n/routing";

type CharactersPageProps = Readonly<{ params: Promise<{ lang: string }> }>;

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: CharactersPageProps): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: "metadata" });
  return {
    title: { absolute: t("siteCharactersTitle") },
    description: t("siteCharactersDescription"),
  };
}

export default async function CharactersPage({ params }: CharactersPageProps) {
  const { lang } = await params;
  setRequestLocale(lang);
  return <ArchiveCharacters />;
}
