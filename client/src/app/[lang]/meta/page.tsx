import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MetaHome } from "@/components/meta/meta-home";
import { routing } from "@/i18n/routing";

type MetaHomePageProps = Readonly<{ params: Promise<{ lang: string }> }>;

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: MetaHomePageProps): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: "metadata" });
  const title = t("metaHomeTitle");
  const description = t("metaHomeDescription");
  return {
    title: { absolute: title },
    description,
    openGraph: {
      type: "website",
      siteName: t("registryName"),
      title,
      description,
    },
    twitter: { card: "summary", title, description },
  };
}

export default async function MetaHomePage({ params }: MetaHomePageProps) {
  const { lang } = await params;
  setRequestLocale(lang);
  return <MetaHome />;
}
