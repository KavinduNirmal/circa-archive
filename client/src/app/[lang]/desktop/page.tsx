import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DesktopShell } from "@/components/desktop-shell";
import { WorkstationBoot } from "@/components/site/boot-sequence";
import { routing } from "@/i18n/routing";

type DesktopPageProps = Readonly<{ params: Promise<{ lang: string }> }>;

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: DesktopPageProps): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: "metadata" });
  return { title: t("desktopTitle"), description: t("desktopDescription") };
}

export default async function DesktopPage({ params }: DesktopPageProps) {
  const { lang } = await params;
  setRequestLocale(lang);
  // The post screen sits in front of the shell, so arriving here reads as powering the machine on.
  return (
    <WorkstationBoot>
      <DesktopShell />
    </WorkstationBoot>
  );
}
