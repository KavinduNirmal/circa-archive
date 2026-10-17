import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LandingPage } from "@/components/site/landing-page";
import { routing } from "@/i18n/routing";

type HomePageProps = Readonly<{ params: Promise<{ lang: string }> }>;

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: "metadata" });
  const title = t("homeTitle");
  const description = t("homeDescription");
  const openGraphLocale = lang === "ko" ? "ko_KR" : "en_GB";

  return {
    title: { absolute: title },
    description,
    openGraph: { type: "website", siteName: t("registryName"), title, description, locale: openGraphLocale },
    twitter: { card: "summary", title, description },
  };
}

export default async function HomePage({ params }: HomePageProps) {
  const { lang } = await params;
  setRequestLocale(lang);
  return <LandingPage />;
}
