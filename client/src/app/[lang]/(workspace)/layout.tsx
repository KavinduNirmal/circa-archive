import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DesktopShell } from "@/components/desktop-shell";
import { WorkstationBoot } from "@/components/site/boot-sequence";
import { WorkstationStoreProvider } from "@/stores/workstation-store-provider";

/**
 * The workstation layout: one shell for every desktop URL.
 *
 * The shell lives in a layout, not in a page, so an in-workspace navigation
 * (a deep link, Back, a record opening) keeps the same mounted shell instead of
 * unmounting it and replaying the post screen. The store's provider sits here
 * too, which is what fixes state lifetime: windows survive a route change inside
 * the workspace and are discarded when the reader leaves for the public archive.
 *
 * The pages under this layout are URL markers that select a resource; the layout
 * does not render `children`. Server-rendering a record body into a window is
 * explicitly out of scope — the public `/{lang}/site/records/[code]` edition owns
 * that — and rendering the child slot would only mount an empty page beside a
 * shell that already owns the screen.
 */
type WorkspaceLayoutProps = Readonly<{ params: Promise<{ lang: string }> }>;

export async function generateMetadata({ params }: WorkspaceLayoutProps): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: "metadata" });
  return {
    title: t("desktopTitle"),
    description: t("desktopDescription"),
    /*
     * The public edition is the canonical, indexable copy of a record. A
     * workstation URL is a workspace position, not a publication address, so
     * every desktop route stays out of the index rather than competing with
     * `/{lang}/site/records/[code]` for the same text.
     */
    robots: { index: false, follow: false },
  };
}

export default async function WorkspaceLayout({ params }: WorkspaceLayoutProps) {
  const { lang } = await params;
  setRequestLocale(lang);
  return (
    <WorkstationStoreProvider>
      <WorkstationBoot>
        <DesktopShell />
      </WorkstationBoot>
    </WorkstationStoreProvider>
  );
}
