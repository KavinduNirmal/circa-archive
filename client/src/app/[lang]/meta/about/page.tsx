import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MetaAbout } from "@/components/meta/meta-about";
import { routing } from "@/i18n/routing";

type MetaAboutPageProps = Readonly<{ params: Promise<{ lang: string }> }>;

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: MetaAboutPageProps): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: "metadata" });
  return {
    title: { absolute: t("metaAboutTitle") },
    description: t("metaAboutDescription"),
  };
}

export default async function MetaAboutPage({ params }: MetaAboutPageProps) {
  const { lang } = await params;
  setRequestLocale(lang);
  return <MetaAbout />;
}
