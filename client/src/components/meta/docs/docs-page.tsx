import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PROJECT_LINKS } from "../meta-links";
import { DOC_GROUPS, DOC_TOPICS, docHref, docNeighbours, type DocTopic } from "./docs-topics";
import { DocsBody } from "./docs-content";
import { DocsSidebar, type DocsSidebarGroup, type DocsSidebarLabels } from "./docs-sidebar";

/**
 * One documentation page: the index, the article, and its table of contents.
 *
 * The sidebar and the on-page contents are different aids. The sidebar answers
 * "where else can I go"; the right rail answers "what is on this page". At
 * 1100px the rail is dropped because the headings are close enough to scroll
 * back to; at 900px the sidebar becomes a disclosure above the article.
 */
export function DocsPage({ topic }: Readonly<{ topic: DocTopic }>) {
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
      };
    }),
  }));

  const sidebarLabels: DocsSidebarLabels = {
    contents: t("docsContents"),
    search: t("docsSearchLabel"),
    searchPlaceholder: t("docsSearchPlaceholder"),
    noResults: t("docsSearchEmpty"),
    results: t("docsSearchResults"),
    close: t("docsClose"),
  };

  const groupLabel = t(DOC_GROUPS.find((group) => group.id === topic.group)!.labelKey);

  return (
    <div className="meta-docs-page">
      <section className="meta-docs-band" aria-labelledby="meta-doc-title">
        <div className="meta-shell">
          <nav className="meta-breadcrumb" aria-label={t("breadcrumbLabel")}>
            <Link href="/meta">{t("brand")}</Link>
            <span aria-hidden="true">/</span>
            <Link href="/meta/documentation">{t("navDocs")}</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{groupLabel}</span>
          </nav>

          <div className="meta-docs-band-grid">
            <div>
              <p className="meta-status-rail">
                <span className="meta-status-dot" aria-hidden="true" />
                <span>{t("docsVersion")}</span>
                <span className="meta-rail-sep" aria-hidden="true">
                  /
                </span>
                <span>{groupLabel}</span>
              </p>
              <h1 id="meta-doc-title">{t(topic.titleKey)}</h1>
              <p className="meta-docs-lede">{t(topic.ledeKey)}</p>
            </div>

            <dl className="meta-docs-facts">
              <div>
                <dt>{t("docsFactPagesTerm")}</dt>
                <dd>{t("docsFactPagesValue")}</dd>
              </div>
              <div>
                <dt>{t("docsFactLanguagesTerm")}</dt>
                <dd>{t("docsFactLanguagesValue")}</dd>
              </div>
              <div>
                <dt>{t("docsFactStatusTerm")}</dt>
                <dd>{t("docsFactStatusValue")}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <div className="meta-shell meta-docs-grid">
        <aside className="meta-docs-aside">
          <DocsSidebar groups={groups} currentSlug={topic.slug} labels={sidebarLabels} />
        </aside>

        <article className="meta-doc">
          <header className="meta-doc-head">
            <p className="meta-kicker">{groupLabel}</p>
            <p className="meta-doc-version">{t("docsVersion")}</p>
          </header>

          <DocsBody topic={topic} />

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
            {topic.sections.map((section, index) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>
                  <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  {t(section.titleKey)}
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
