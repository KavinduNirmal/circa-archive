import { redirect } from "next/navigation";
import { randomRecordCode } from "@/components/archive-site/archive-data";

/**
 * The random record door.
 *
 * It redirects rather than drawing a page of its own: the destination is a real
 * record address, so the reader can bookmark it, and the archive's "random" is
 * never a page with nothing on it. It is resolved per request, which is why this
 * route is dynamic.
 */
export const dynamic = "force-dynamic";

export default async function RandomRecordPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  redirect(`/${lang}/site/records/${randomRecordCode()}`);
}
