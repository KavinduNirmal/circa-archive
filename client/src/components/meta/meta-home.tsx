import { ArrowDown, ArrowRight, ArrowUpRight, Check, GitFork, Heart, Scale, Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { EXTERNAL, ISSUES, LICENCES, PROJECT_LINKS } from "./meta-links";
import { EditionCards, RECORD_COUNT, SectionBand, SpecimenCard } from "./meta-parts";
import { DOC_GROUPS, DOC_TOPICS, docHref, docTopic } from "./docs/docs-topics";

/**
 * The project's front page, composed as a filed report rather than a stack of
 * landing-page modules.
 *
 * The reading order is the argument: a hero that states what this is, a premise
 * with one record as evidence, the two editions, the manual, the machinery, the
 * way to contribute, and the questions. Every section is a row inside the
 * frame; the folio number in the left rail is the only ornament, and the single
 * dot field belongs to the plate in the hero.
 */

const STACK = ["Next.js 16", "React 19", "TypeScript", "Tailwind CSS 4", "next-intl", "remark", "Vitest", "Playwright"];

/** The documentation's contents, numbered once and used as the landing index. */
const DOC_MANUAL = (() => {
  const numbered = DOC_TOPICS.map((topic, index) => ({
    slug: topic.slug,
    titleKey: topic.navKey,
    href: docHref(topic.slug),
    number: String(index + 1).padStart(2, "0"),
  }));

  return DOC_GROUPS.map((group) => {
    const items = numbered.filter((item) => docTopic(item.slug)!.group === group.id);
    return {
      labelKey: group.labelKey,
      items,
      range: `${items[0].number}–${items[items.length - 1].number}`,
    };
  });
})();

const FLOW = [
  { step: "01", title: "flowSource", note: "flowSourceNote" },
  { step: "02", title: "flowParse", note: "flowParseNote" },
  { step: "03", title: "flowRender", note: "flowRenderNote" },
  { step: "04", title: "flowEditions", note: "flowEditionsNote" },
] as const;

const OPEN_SOURCE = [
  { icon: Scale, term: "homeLicenceTerm", value: "homeLicenceValue" },
  { icon: Wrench, term: "homeMaintainerTerm", value: "homeMaintainerValue" },
  { icon: GitFork, term: "homeRepoTerm", value: "homeRepoValue" },
  { icon: Heart, term: "homeSponsorTerm", value: "homeSponsorValue" },
] as const;

const LANDING_FAQ = [
  ["faqRealQ", "faqRealA"],
  ["faqWriteQ", "faqWriteA"],
  ["faqReuseQ", "faqReuseA"],
  ["faqRoadmapQ", "faqRoadmapA"],
] as const;

export function MetaHome() {
  const t = useTranslations("meta");

  return (
    <>
      <section className="meta-hero" aria-labelledby="meta-hero-title">
        <div className="meta-shell meta-hero-grid">
          <div className="meta-hero-copy">
            <p className="meta-status-rail">
              <span className="meta-status-dot" aria-hidden="true" />
              <span>{t("heroStatus")}</span>
              <span className="meta-rail-sep" aria-hidden="true">
                /
              </span>
              <span>{t("heroStatusValue")}</span>
            </p>

            <h1 className="meta-display" id="meta-hero-title">
              <span>{t("heroTitleA")}</span>{" "}
              <span className="meta-display-dim">{t("heroTitleB")}</span>
            </h1>

            <p className="meta-hero-lede">{t("homeLede")}</p>

            <div className="meta-actions">
              <Link className="meta-button" href="/meta/documentation">
                {t("heroPrimary")}
                <ArrowRight aria-hidden="true" size={15} />
              </Link>
              <Link className="meta-button-outline" href="/site">
                {t("heroSecondary")}
                <ArrowUpRight aria-hidden="true" size={14} />
              </Link>
              <a className="meta-text-link" href={PROJECT_LINKS.repository} {...EXTERNAL}>
                {t("heroSource")}
                <ArrowUpRight aria-hidden="true" size={13} />
              </a>
            </div>

            <p className="meta-fineprint">{t("heroNote")}</p>
          </div>

          <figure className="meta-hero-plate">
            <div className="meta-plate-bar">
              <span className="meta-plate-bar-label">{t("plateLabel")}</span>
              <span className="meta-plate-bar-status">
                <span className="meta-status-dot" aria-hidden="true" />
                {t("plateStatus")}
              </span>
            </div>

            <div className="meta-halftone" aria-hidden="true">
              <span className="meta-halftone-layer meta-halftone-a" />
              <span className="meta-halftone-layer meta-halftone-b" />
              <img className="meta-halftone-mark" src="/circa_snake_with_eye.svg" alt="" />
              <span className="meta-cross meta-cross-tl" />
              <span className="meta-cross meta-cross-tr" />
              <span className="meta-cross meta-cross-bl" />
              <span className="meta-cross meta-cross-br" />
              <span className="meta-halftone-grid" />
              <span className="meta-halftone-axis" />
            </div>

            <figcaption className="meta-plate-caption">
              <span className="meta-plate-figure">{t("plateFigure")}</span>
              <span>{t("plateCaptionHome")}</span>
            </figcaption>
          </figure>
        </div>

        <div className="meta-shell meta-hero-foot">
          <dl className="meta-stats">
            <div>
              <dt>{t("statRecords")}</dt>
              <dd>{RECORD_COUNT}</dd>
            </div>
            <div>
              <dt>{t("statEditions")}</dt>
              <dd>02</dd>
            </div>
            <div>
              <dt>{t("statLanguages")}</dt>
              <dd className="meta-stat-words">{t("statLanguagesValue")}</dd>
            </div>
            <div>
              <dt>{t("statBackend")}</dt>
              <dd className="meta-stat-dim">{t("statNone")}</dd>
            </div>
            <div>
              <dt>{t("statLicence")}</dt>
              <dd className="meta-stat-words">{t("statLicenceValue")}</dd>
            </div>
          </dl>
          <a className="meta-scroll" href="#premise">
            {t("scroll")}
            <ArrowDown aria-hidden="true" size={14} />
          </a>
        </div>
      </section>

      <section className="meta-section meta-section-first" id="premise" aria-labelledby="meta-premise-title">
        <div className="meta-shell">
          <SectionBand
            id="meta-premise-title"
            index={t("homePremiseIndex")}
            kicker={t("homePremiseKicker")}
            title={t("homePremiseTitle")}
            action={
              <Link className="meta-text-link" href="/meta/about#premise">
                {t("homePremiseLink")}
                <ArrowRight aria-hidden="true" size={14} />
              </Link>
            }
          />

          <div className="meta-premise-grid">
            <div className="meta-prose">
              <p>{t("premiseBody")}</p>
              <p>{t("premiseBodyTwo")}</p>
            </div>

            <aside className="meta-premise-evidence">
              <p className="meta-evidence-label">
                <span className="meta-kicker">{t("homeSpecimenKicker")}</span>
                <span className="meta-note-inline">{t("specimenNote")}</span>
              </p>
              <SpecimenCard />
            </aside>
          </div>
        </div>
      </section>

      <section className="meta-section" id="editions" aria-labelledby="meta-editions-title">
        <div className="meta-shell">
          <SectionBand
            id="meta-editions-title"
            index={t("homeEditionsIndex")}
            kicker={t("editionsKicker")}
            title={t("editionsTitle")}
            lede={t("editionsLede")}
          />
          <EditionCards />
          <p className="meta-note meta-editions-note">{t("editionsNote")}</p>
        </div>
      </section>

      <section className="meta-section" id="documentation" aria-labelledby="meta-docs-title">
        <div className="meta-shell">
          <SectionBand
            id="meta-docs-title"
            index={t("homeDocsIndex")}
            kicker={t("docsTeaserKicker")}
            title={t("docsTeaserTitle")}
            lede={t("docsTeaserLede")}
            action={
              <Link className="meta-text-link" href="/meta/documentation">
                {t("docsAllLink")}
                <ArrowRight aria-hidden="true" size={14} />
              </Link>
            }
          />

          <div className="meta-manual">
            <nav className="meta-manual-index" aria-label={t("docsContents")}>
              {DOC_MANUAL.map((group) => (
                <div className="meta-manual-group" key={group.labelKey}>
                  <p className="meta-manual-group-title">{t(group.labelKey)}</p>
                  <ol>
                    {group.items.map((item) => (
                      <li key={item.href}>
                        <Link className="meta-manual-link" href={item.href}>
                          <span className="meta-manual-number">{item.number}</span>
                          <span className="meta-manual-name">{t(item.titleKey)}</span>
                          <ArrowRight className="meta-manual-arrow" aria-hidden="true" size={14} />
                        </Link>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </nav>

            <div className="meta-manual-terminal">
              <div className="meta-terminal-bar">
                <span>
                  <span className="meta-terminal-prompt" aria-hidden="true">
                    $
                  </span>
                  {t("quickstartTitle")}
                </span>
                <span>{t("quickstartMeta")}</span>
              </div>
              <pre className="meta-terminal-code">
                <code>{`bun install --frozen-lockfile
bun run --cwd=client dev
# http://localhost:3001/en/meta`}</code>
              </pre>
              <pre className="meta-terminal-tree" aria-label={t("docsStructureTreeLabel")}>
                <code>{`client/
├── messages/
├── src/app/[lang]/
└── src/components/meta/`}</code>
              </pre>
              <ul className="meta-terminal-map" aria-label={t("docsContents")}>
                {DOC_MANUAL.map((group) => (
                  <li key={group.labelKey}>
                    <span>{group.range}</span>
                    {t(group.labelKey)}
                  </li>
                ))}
              </ul>
              <div className="meta-terminal-foot">
                <p>{t("quickstartNote")}</p>
                <Link className="meta-text-link" href={docHref("getting-started")}>
                  {t("docsStartCard1Link")}
                  <ArrowRight aria-hidden="true" size={13} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="meta-section" id="built" aria-labelledby="meta-built-title">
        <div className="meta-shell">
          <SectionBand
            id="meta-built-title"
            index={t("homeBuiltIndex")}
            kicker={t("builtKicker")}
            title={t("builtTitle")}
            lede={t("builtLede")}
          />

          <ol className="meta-flow">
            {FLOW.map((item) => (
              <li className="meta-flow-step" key={item.step}>
                <span className="meta-flow-index">{item.step}</span>
                <strong>{t(item.title)}</strong>
                <span className="meta-flow-note">{t(item.note)}</span>
              </li>
            ))}
          </ol>

          <div className="meta-build-grid">
            <dl className="meta-ledger">
              {[
                ["factPipelineTerm", "factPipelineDetail"],
                ["factPagesTerm", "factPagesDetail"],
                ["factLanguageTerm", "factLanguageDetail"],
                ["factTestsTerm", "factTestsDetail"],
              ].map(([term, detail]) => (
                <div className="meta-ledger-row" key={term}>
                  <dt>{t(term)}</dt>
                  <dd>{t(detail)}</dd>
                </div>
              ))}
            </dl>

            <aside className="meta-build-aside">
              <p className="meta-kicker">{t("stackLabel")}</p>
              <ul className="meta-stack">
                {STACK.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <Link className="meta-text-link" href={docHref("rendering")}>
                {t("builtDocsLink")}
                <ArrowRight aria-hidden="true" size={14} />
              </Link>
            </aside>
          </div>
        </div>
      </section>

      <section className="meta-section" id="contribute" aria-labelledby="meta-contribute-title">
        <div className="meta-shell">
          <SectionBand
            id="meta-contribute-title"
            index={t("homeContributeIndex")}
            kicker={t("contributeKicker")}
            title={t("contributeTitle")}
            lede={t("contributeLede")}
          />

          <ol className="meta-steps">
            {[
              { index: "01", title: "stepGuideTitle", body: "stepGuideBody" },
              { index: "02", title: "stepChangeTitle", body: "stepChangeBody" },
              { index: "03", title: "stepChecksTitle", body: "stepChecksBody" },
            ].map((step) => (
              <li className="meta-step" key={step.index}>
                <p className="meta-step-index" aria-hidden="true">
                  {step.index}
                </p>
                <h3>{t(step.title)}</h3>
                <p>{t(step.body)}</p>
              </li>
            ))}
          </ol>

          <div className="meta-contribute-actions">
            <p className="meta-command">
              <span aria-hidden="true">$</span>
              <code>{t("stepChecksCommand")}</code>
            </p>
            <a className="meta-button" href={PROJECT_LINKS.repository} {...EXTERNAL}>
              {t("contributeRepository")}
              <ArrowUpRight aria-hidden="true" size={15} />
            </a>
            <Link className="meta-text-link" href={docHref("contributing")}>
              {t("homeOpenLink")}
              <ArrowRight aria-hidden="true" size={14} />
            </Link>
          </div>

          <div className="meta-open">
            <div className="meta-open-head">
              <p className="meta-kicker">{t("homeOpenKicker")}</p>
              <h3>{t("homeOpenTitle")}</h3>
              <p>{t("homeOpenBody")}</p>
            </div>

            <dl className="meta-open-ledger">
              {OPEN_SOURCE.map((item) => {
                const Icon = item.icon;
                return (
                  <div className="meta-open-row" key={item.term}>
                    <dt>
                      <Icon aria-hidden="true" size={14} strokeWidth={1.5} />
                      {t(item.term)}
                    </dt>
                    <dd>{t(item.value)}</dd>
                  </div>
                );
              })}
            </dl>
          </div>
        </div>
      </section>

      <section className="meta-section" id="questions" aria-labelledby="meta-questions-title">
        <div className="meta-shell">
          <SectionBand
            id="meta-questions-title"
            index={t("homeQuestionsIndex")}
            kicker={t("faqKicker")}
            title={t("faqTitle")}
            lede={t("faqLede")}
            action={
              <Link className="meta-text-link" href="/meta/about#questions">
                {t("homeFaqLink")}
                <ArrowRight aria-hidden="true" size={14} />
              </Link>
            }
          />

          <div className="meta-faq">
            {LANDING_FAQ.map(([question, answer]) => (
              <details className="meta-faq-item" name="meta-home-questions" key={question}>
                <summary>{t(question)}</summary>
                <p>{t(answer)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="meta-cta" aria-labelledby="meta-cta-title">
        <div className="meta-shell meta-cta-inner">
          <div className="meta-cta-copy">
            <p className="meta-kicker">{t("homeCtaKicker")}</p>
            <h2 id="meta-cta-title">{t("homeCtaTitle")}</h2>
            <p className="meta-cta-body">{t("homeCtaBody")}</p>
          </div>

          <div className="meta-cta-actions">
            <div className="meta-actions">
              <Link className="meta-button" href="/meta/documentation">
                {t("homeCtaPrimary")}
                <ArrowRight aria-hidden="true" size={15} />
              </Link>
              <a className="meta-button-outline" href={PROJECT_LINKS.repository} {...EXTERNAL}>
                {t("homeCtaSecondary")}
                <ArrowUpRight aria-hidden="true" size={14} />
              </a>
            </div>
            <p className="meta-cta-foot">
              <span className="meta-cta-note">
                <Check aria-hidden="true" size={13} />
                {t("homeCtaFoot")}
              </span>
              <span className="meta-cta-links">
                <a href={ISSUES.bug} {...EXTERNAL}>
                  {t("footerBug")}
                </a>
                <a href={PROJECT_LINKS.sponsor} {...EXTERNAL}>
                  {t("footerSponsor")}
                </a>
                <a href={LICENCES.content.href} {...EXTERNAL}>
                  {LICENCES.content.name}
                </a>
              </span>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
