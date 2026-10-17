import { ARCHIVE_INDEX } from "@/components/browser/archive-index";
import { recordSource } from "@/components/reader/record-sources";
import { renderText } from "@/lib/markdown/emitters/to-text";

/**
 * A copy of a released filing, as a file.
 *
 * The archive offers the two formats it can honestly produce from the one
 * source it holds: the authored Markdown, and the plain-text export that prints
 * redactions as `[REDACTED]` and the metadata as a header. A held filing has no
 * copy to give, so the request fails rather than returning a page-shaped
 * substitute.
 */
export async function GET(request: Request, { params }: { params: Promise<{ lang: string; code: string }> }) {
  const { code } = await params;
  const entry = ARCHIVE_INDEX.find((item) => item.code === code);
  const source = recordSource(code);
  if (!entry || !source) {
    return new Response("No copy is held for this filing.\n", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const format = new URL(request.url).searchParams.get("format") === "md" ? "md" : "txt";
  const header = [
    entry.designation ?? "Designation withheld",
    `${entry.code} · filed ${entry.filed} · ${entry.organization} · ${entry.clearance}`,
    "",
  ].join("\n");
  const body = format === "md" ? source : renderText({ markdown: source }).output;

  return new Response(header + body, {
    headers: {
      "content-type": format === "md" ? "text/markdown; charset=utf-8" : "text/plain; charset=utf-8",
      "content-disposition": `attachment; filename="${entry.code}.${format}"`,
      "cache-control": "public, max-age=3600",
    },
  });
}
