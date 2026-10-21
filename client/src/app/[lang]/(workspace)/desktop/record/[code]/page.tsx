import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ARCHIVE_INDEX } from "@/components/browser/archive-index";
import { isRecordCode } from "@/lib/desktop-route";

/**
 * `/{lang}/desktop/record/{code}` — the reader focused on an archive code.
 *
 * A URL marker like the other pages in this group; the layout owns the shell and
 * the URL sync opens the reader. Every released code is prerendered in both
 * languages, and anything else is a 404, matching the public record route.
 *
 * Codes may contain a slash (`ORG-C-005102/C1`), which Next writes as one
 * percent-encoded segment. The static params use the raw code, and the incoming
 * param is decoded defensively so the page does not depend on which form the
 * router hands over.
 */
type RecordPageProps = Readonly<{
  params: Promise<{ lang: string; code: string }>;
}>;

export const dynamicParams = false;

export function generateStaticParams() {
  return ARCHIVE_INDEX.map((entry) => ({ code: entry.code }));
}

function decoded(code: string): string {
  try {
    return decodeURIComponent(code);
  } catch {
    return code;
  }
}

export default async function RecordPage({ params }: RecordPageProps) {
  const { lang, code } = await params;
  setRequestLocale(lang);
  if (!isRecordCode(decoded(code))) notFound();
  return null;
}
