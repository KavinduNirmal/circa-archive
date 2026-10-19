import { ArrowLeft, ArrowRight, ArrowUpRight, GitBranch } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PROJECT_LINKS } from "../meta-links";
import { DOC_GROUPS, DOC_TOPICS, docHref, docNeighbours, type DocTopic } from "./docs-topics";
import { DocsActions } from "./docs-actions";
import { documentationHeadings, documentTitle } from "./docs-markdown";
import { sourcePath, sourceUrl, type DocumentationEntry } from "./docs-source";
import { DocsBody } from "./docs-content";
import { DocsSidebar, type DocsSidebarGroup, type DocsSidebarLabels } from "./docs-sidebar";

/**
 * One documentation page: the index, the article, and its table of contents.
 *
 * The sidebar and the on-page contents are different aids. The sidebar answers
 * "where else can I go"; the right rail answers "what is on this page". At
 * 1100px the rail is dropped because the headings are close enough to scroll
 * back to; at 900px the sidebar becomes a disclosure above the article.
 *
 * The band carries the breadcrumb and the source title:
 * the version and the topic count are facts about the documentation as a whole,
 * and they are stated once, on the overview, rather than stamped on every page.
 */
export function DocsPage({ topic, documents, locale, updatedAt = null }: Readonly<{ topic: DocTopic; documents: DocumentationEntry[]; locale: string; updatedAt?: string | null }>) {
  const markdown = documents.find(document => document.slug === topic.slug)?.markdown ?? null;
  const path = sourcePath(topic, locale);
  const headings = documentationHeadings(markdown ?? "");
  const t = useTranslations("meta");
  const { previous, next } = docNeighbours(topic.slug);

  const groups: DocsSidebarGroup[] = DOC_GROUPS.map((group) => ({
    label: t(group.labelKey),
    items: group.slugs.map((slug) => {
      const index = DOC_TOPICS.findIndex((candidate) => candidate.slug === slug);
      const item = DOC_TOPICS[index];
      return {
        label: t(item.navKey),
        href: docHref(slug),
        slug,
        number: String(index + 1).padStart(2, "0"),
        text: documents.find(document => document.slug === slug)?.markdown ?? "",
      };
    }),
  }));

  const isPartial = documents.some((document) => document.markdown === null);

  const sidebarLabels: DocsSidebarLabels = {
    contents: t("docsContents"),
    search: t("docsSearchLabel"),
    searchPlaceholder: t("docsSearchPlaceholder"),
    noResults: t("docsSearchEmpty"),
    results: t("docsSearchResults"),
    close: t("docsClose"),
    searchPartial: t("docsSearchPartial"),
  };

  const groupLabel = t(DOC_GROUPS.find((group) => group.id === topic.group)!.labelKey);

  const docTitle = documentTitle(markdown ?? "") ?? t(topic.titleKey);

  return (
    <div className="meta-docs-page">
      <div className="meta-shell meta-docs-grid">
        <aside className="meta-docs-aside">
          <DocsSidebar groups={groups} currentSlug={topic.slug} labels={sidebarLabels} partial={isPartial} />
        </aside>

        <article className="meta-doc">
          <header className="meta-doc-header">
            <nav className="meta-breadcrumb" aria-label={t("breadcrumbLabel")}>
              <Link href="/meta">{t("brand")}</Link>
              <span aria-hidden="true">/</span>
              <Link href="/meta/documentation">{t("navDocs")}</Link>
              <span aria-hidden="true">/</span>
              <span>{groupLabel}</span>
              <span aria-hidden="true">/</span>
              <span aria-current="page">{t(topic.navKey)}</span>
            </nav>

            <h1 id="meta-doc-title">{docTitle}</h1>

            {markdown !== null && <DocsActions key={path} markdown={markdown} sourceUrl={sourceUrl(path)} editUrl={sourceUrl(path, "edit")} labels={{
              edit: t("docsEdit"), copy: t("docsCopyMarkdown"), copied: t("docsCopied"), failed: t("docsMarkdownCopyFailed"),
              chat: t("docsChatGPT"), chatHelp: t("docsChatGPTHelp"), context: t("docsChatGPTContext"), paste: t("docsChatGPTPaste"),
            }} />}
          </header>

          {markdown !== null ? <>
            <DocsBody markdown={markdown} path={path} />
          </> : <div role="alert" className="meta-doc-callout">
            <p>{t("docsLoadFailed")}</p>
            <a href={`/${locale}${docHref(topic.slug)}`}>{t("docsRetry")}</a>{" · "}
            <a href={sourceUrl(path)} target="_blank" rel="noreferrer">{t("footerSource")}</a>
          </div>}

          <footer className="meta-doc-source-footer">
            <span>{markdown !== null && updatedAt && <time dateTime={updatedAt}>{t("docsUpdated", { date: new Intl.DateTimeFormat(locale, { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(updatedAt)) })}</time>}</span>
            <a href={sourceUrl(path, "edit")} target="_blank" rel="noreferrer">
              <GitBranch size={15} aria-hidden="true" />
              {t("docsEdit")}
              <ArrowUpRight size={12} aria-hidden="true" />
            </a>
          </footer>

          <nav className="meta-doc-pager" aria-label={t("docsPager")}>
            {previous ? (
              <Link className="meta-doc-pager-link" data-dir="previous" href={docHref(previous.slug)}>
                <span className="meta-doc-pager-label">
                  <ArrowLeft aria-hidden="true" size={13} />
                  {t("docsPrevious")}
                </span>
                <strong>{t(previous.navKey)}</strong>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link className="meta-doc-pager-link" data-dir="next" href={docHref(next.slug)}>
                <span className="meta-doc-pager-label">
                  {t("docsNext")}
                  <ArrowRight aria-hidden="true" size={13} />
                </span>
                <strong>{t(next.navKey)}</strong>
              </Link>
            ) : (
              <Link className="meta-doc-pager-link" data-dir="next" href={PROJECT_LINKS.repository} target="_blank" rel="noreferrer">
                <span className="meta-doc-pager-label">
                  {t("docsNext")}
                  <ArrowUpRight aria-hidden="true" size={13} />
                </span>
                <strong>{t("footerSource")}</strong>
              </Link>
            )}
          </nav>
        </article>

        <nav className="meta-doc-toc" aria-label={t("docsOnThisPage")}>
          <p className="meta-doc-toc-title">{t("docsOnThisPage")}</p>
          <ol>
            {headings.map((section, index) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>
                  <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
          <div className="meta-doc-toc-foot">
            <p>{t("docsTocHelp")}</p>
            <Link className="meta-doc-inline-link" href={docHref("contributing")}>
              {t("docsTocContribute")}
              <ArrowRight aria-hidden="true" size={13} />
            </Link>
            <a className="meta-doc-inline-link" href={PROJECT_LINKS.repository} target="_blank" rel="noreferrer">
              {t("footerSource")}
              <ArrowUpRight aria-hidden="true" size={12} />
            </a>
          </div>
        </nav>
      </div>
    </div>
  );
}
