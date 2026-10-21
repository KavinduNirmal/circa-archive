import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { allDestinations, isDestinationId } from "@/lib/desktop-destinations";

/**
 * `/{lang}/desktop/{destination}` — the workstation with a shortcut focused.
 *
 * A URL marker like its parent page: the workspace layout owns the shell, and
 * `DesktopUrlSync` turns this address into a window. It exists to match and
 * prerender the route, to fail with a 404 for anything that is not a shortcut,
 * and to keep the closed destination list next to the data that defines it.
 */
type DestinationPageProps = Readonly<{
  params: Promise<{ lang: string; destination: string }>;
}>;

/** Only the destinations that exist at build time are addressed; anything else is a 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return allDestinations.map((entry) => ({ destination: entry.id }));
}

export default async function DestinationPage({
  params,
}: DestinationPageProps) {
  const { lang, destination } = await params;
  setRequestLocale(lang);
  // `dynamicParams = false` is the build-time guard; this is the runtime one.
  if (!isDestinationId(destination)) notFound();
  return null;
}
