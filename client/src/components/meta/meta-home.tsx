import { ArrowRight, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { EXTERNAL, PROJECT_LINKS } from "./meta-links";
import {
  EditionCards,
  RECORD_COUNT,
  SectionBand,
  SpecimenCard,
} from "./meta-parts";
import { docHref } from "./docs/docs-topics";

/**
 * The project's front page: a report, not a sales page.
 *
 * Six sections, in the order a reader needs them: what this is, the two
 * editions, the specifications, the machinery, the way in, and the questions. Every
 * section opens with the same band — folio number, kicker, title, lede — so the
 * page teaches its own rhythm and nothing has to be boxed twice. There is no
 * closing pitch: the record ends, and the footer answers what is left.
 */

const STACK = [
  "Next.js 16",
  "React 19",
  "TypeScript",
  "Tailwind CSS 4",
  "next-intl",
  "remark",
  "Vitest",
];

const FLOW = [
  { step: "01", title: "flowSource", note: "flowSourceNote" },
  { step: "02", title: "flowParse", note: "flowParseNote" },
  { step: "03", title: "flowRender", note: "flowRenderNote" },
  { step: "04", title: "flowEditions", note: "flowEditionsNote" },
] as const;

const FACTS = [
  ["factRecordsTerm", "factRecordsDetail"],
  ["factPagesTerm", "factPagesDetail"],
  ["factLanguageTerm", "factLanguageDetail"],
  ["factTestsTerm", "factTestsDetail"],
] as const;

const CONTRIBUTE_STEPS = [
  { index: "01", title: "stepGuideTitle", body: "stepGuideBody" },
  { index: "02", title: "stepChangeTitle", body: "stepChangeBody" },
  { index: "03", title: "stepChecksTitle", body: "stepChecksBody" },
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
        {/*
          The header's field: a dot screen and the seal, faded into it. This is
          the whole of the ornament on the landing page — no plate, no figure
          number, no frame — so the headline is the only thing competing for the
          reader's attention.
        */}
        <div className="meta-hero-field" aria-hidden="true">
          <span className="meta-hero-dots meta-hero-dots-fine" />
          <span className="meta-hero-dots meta-hero-dots-coarse" />
          <Image
            className="meta-hero-eye"
            src="/circa_snake_with_eye.svg"
            alt=""
            width={710}
            height={755}
            unoptimized
          />
        </div>

        <div className="meta-shell meta-hero-grid">
          <div className="meta-hero-copy">
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
              <a
                className="meta-text-link"
                href={PROJECT_LINKS.repository}
                {...EXTERNAL}
              >
                {t("heroSource")}
                <ArrowUpRight aria-hidden="true" size={13} />
              </a>
            </div>

            <p className="meta-fineprint">{t("heroNote")}</p>
          </div>
        </div>

        <div className="meta-shell meta-hero-foot">
          <dl className="meta-stats">
            <div>
              <dt>{t("statRecords")}</dt>
              <dd>{RECORD_COUNT}</dd>
            </div>
            <div>
              <dt>{t("statLanguages")}</dt>
              <dd>{t("statLanguagesValue")}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section
        className="meta-section meta-section-first"
        id="premise"
        aria-labelledby="meta-premise-title"
      >
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

      <section
        className="meta-section"
        id="editions"
        aria-labelledby="meta-editions-title"
      >
        <div className="meta-shell">
          <SectionBand
            id="meta-editions-title"
            index={t("homeEditionsIndex")}
            kicker={t("editionsKicker")}
            title={t("editionsTitle")}
            lede={t("editionsLede")}
          />
          <EditionCards />
        </div>
      </section>

      <section
        className="meta-section meta-docs-section"
        id="documentation"
        aria-labelledby="meta-docs-title"
      >
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

          <div className="meta-docs-pillars">
            <article className="meta-docs-pillar">
              <div className="meta-docs-pillar-head">
                <span className="meta-docs-pillar-folio">01</span>
                <span className="meta-docs-pillar-tag">System Specs</span>
              </div>
              <h3 className="meta-docs-pillar-title">
                {t("docsPillarArchTitle")}
              </h3>
              <p className="meta-docs-pillar-body">{t("docsPillarArchBody")}</p>
              <Link
                className="meta-docs-pillar-link"
                href={docHref("architecture")}
              >
                <span>{t("docsPillarArchLink")}</span>
                <ArrowRight aria-hidden="true" size={13} />
              </Link>
            </article>

            <article className="meta-docs-pillar">
              <div className="meta-docs-pillar-head">
                <span className="meta-docs-pillar-folio">02</span>
                <span className="meta-docs-pillar-tag">Field Guide</span>
              </div>
              <h3 className="meta-docs-pillar-title">
                {t("docsPillarAuthorTitle")}
              </h3>
              <p className="meta-docs-pillar-body">
                {t("docsPillarAuthorBody")}
              </p>
              <Link
                className="meta-docs-pillar-link"
                href={docHref("author-guide")}
              >
                <span>{t("docsPillarAuthorLink")}</span>
                <ArrowRight aria-hidden="true" size={13} />
              </Link>
            </article>

            <article className="meta-docs-pillar">
              <div className="meta-docs-pillar-head">
                <span className="meta-docs-pillar-folio">03</span>
                <span className="meta-docs-pillar-tag">Universe Canon</span>
              </div>
              <h3 className="meta-docs-pillar-title">
                {t("docsPillarLoreTitle")}
              </h3>
              <p className="meta-docs-pillar-body">{t("docsPillarLoreBody")}</p>
              <Link className="meta-docs-pillar-link" href={docHref("lore")}>
                <span>{t("docsPillarLoreLink")}</span>
                <ArrowRight aria-hidden="true" size={13} />
              </Link>
            </article>
          </div>
        </div>
      </section>

      <section
        className="meta-section"
        id="built"
        aria-labelledby="meta-built-title"
      >
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

          <dl className="meta-facts">
            {FACTS.map(([term, detail]) => (
              <div className="meta-fact" key={term}>
                <dt>{t(term)}</dt>
                <dd>{t(detail)}</dd>
              </div>
            ))}
          </dl>

          <p className="meta-colophon">
            <span className="meta-colophon-label">{t("stackLabel")}</span>
            {STACK.join(" · ")}
          </p>

          <Link
            className="meta-text-link meta-section-link"
            href={docHref("rendering")}
          >
            {t("builtDocsLink")}
            <ArrowRight aria-hidden="true" size={14} />
          </Link>
        </div>
      </section>

      <section
        className="meta-section"
        id="contribute"
        aria-labelledby="meta-contribute-title"
      >
        <div className="meta-shell">
          <SectionBand
            id="meta-contribute-title"
            index={t("homeContributeIndex")}
            kicker={t("contributeKicker")}
            title={t("contributeTitle")}
            lede={t("contributeLede")}
          />

          <ol className="meta-steps">
            {CONTRIBUTE_STEPS.map((step) => (
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
            <a
              className="meta-button"
              href={PROJECT_LINKS.repository}
              {...EXTERNAL}
            >
              {t("contributeRepository")}
              <ArrowUpRight aria-hidden="true" size={15} />
            </a>
            <Link className="meta-text-link" href={docHref("contributing")}>
              {t("homeOpenLink")}
              <ArrowRight aria-hidden="true" size={14} />
            </Link>
          </div>
        </div>
      </section>

      <section
        className="meta-section"
        id="questions"
        aria-labelledby="meta-questions-title"
      >
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
              <details
                className="meta-faq-item"
                name="meta-home-questions"
                key={question}
              >
                <summary>{t(question)}</summary>
                <p>{t(answer)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
