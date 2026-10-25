import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArchiveChrome } from "@/components/archive-site/archive-chrome";
import { SiteIncidentEditor } from "@/components/incident-editor/site-editor";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ lang: string }> };
export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: "editor" });
  return { title: t("title"), description: t("description") };
}
export default async function EditorPage({ params }: Props) {
  const { lang } = await params;
  setRequestLocale(lang);
  const t = await getTranslations("editor");
  const site = await getTranslations("site");
  return (
    <ArchiveChrome
      active="editor"
      compact
      trail={[
        { label: site("writeTitle"), href: "/site/write" },
        { label: t("title") },
      ]}
    >
      <main id="site-content" tabIndex={-1}>
        <SiteIncidentEditor />
      </main>
    </ArchiveChrome>
  );
}
