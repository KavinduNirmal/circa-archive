import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

/**
 * `/{lang}/desktop` — the workstation with nothing focused.
 *
 * The layout owns the shell, the post screen, and the metadata, so this page is
 * only a URL marker: it exists so the route resolves and prerenders. The deep
 * link pages beside it do the same thing for a destination or a record.
 */
type DesktopPageProps = Readonly<{ params: Promise<{ lang: string }> }>;

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

export default async function DesktopPage({ params }: DesktopPageProps) {
  const { lang } = await params;
  setRequestLocale(lang);
  return null;
}
