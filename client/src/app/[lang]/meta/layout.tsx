import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource/noto-serif-kr/400.css";
import { setRequestLocale } from "next-intl/server";
import { MetaChrome } from "@/components/meta/meta-chrome";
import { routing } from "@/i18n/routing";
import "@/components/meta/meta.css";

type MetaLayoutProps = Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>;

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

/**
 * The project layer's frame: its fonts, its stylesheet, and the chrome shared by
 * the landing page, the dossier, and the documentation.
 *
 * The stylesheet is imported here rather than from each page so the field, the
 * header, and the footer cannot render unstyled on one route. It stays scoped to
 * `.meta-page`; the archive and the workstation never inherit it.
 */
export default async function MetaLayout({
  children,
  params,
}: MetaLayoutProps) {
  const { lang } = await params;
  setRequestLocale(lang);

  return <MetaChrome lang={lang}>{children}</MetaChrome>;
}
