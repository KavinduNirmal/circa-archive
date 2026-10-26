import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getArchiveDestination } from "@/lib/search/destination";
import { ArchiveApiDossier } from "@/components/archive-site/archive-api-dossier";

type Props = { params: Promise<{ lang: string; code: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, code } = await params;
  const result = await getArchiveDestination(code);
  if (result.status !== "success" || result.destination.type !== "recovery")
    return {};
  const t = await getTranslations({ locale: lang, namespace: "site" });
  return {
    title: `${result.destination.title} · ${result.destination.code} | ${t("homeTitle")}`,
  };
}

export default async function RecoveryPage({ params }: Props) {
  const { lang, code } = await params;
  setRequestLocale(lang);
  const result = await getArchiveDestination(code);
  if (
    result.status === "missing" ||
    (result.status === "success" && result.destination.type !== "recovery")
  )
    notFound();
  if (result.status !== "success")
    throw new Error("Recovery entry unavailable");
  return <ArchiveApiDossier destination={result.destination} />;
}
