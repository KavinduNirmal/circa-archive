import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AccessPage } from "@/components/auth/access-page";
import type { Locale } from "@/i18n/routing";

type PageProps = { params: Promise<{ lang: Locale }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: "auth" });
  return { title: t("signUp"), robots: { index: false, follow: false } };
}

export default async function Page({ params }: PageProps) {
  const { lang } = await params;
  setRequestLocale(lang);
  return AccessPage({ mode: "sign-up", locale: lang });
}
