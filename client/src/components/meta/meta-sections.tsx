import { useTranslations } from "next-intl";
import { ArrowRight, ArrowUpRight, Bug, Lightbulb, Mail } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { EXTERNAL, ISSUES, LICENCES, MAINTAINER, PROJECT_LINKS } from "./meta-links";
import { SEAL_PLATE } from "./meta-plate";
import { EditionCards, SectionHead } from "./meta-parts";

/**
 * The body of the project page, in the order the argument is made.
 *
 * The page answers a reader who arrived from a record and a visitor who arrived
 * from nowhere: first the fiction it is selling, then the two editions it
 * actually ships, then how it is built, then how to join in, then who is already
 * here, then how to keep it running, and finally the licences and the terms. Each
 * section is a landmark with its own heading, so the header nav and a screen
 * reader's outline agree.
 */

const FACTS = [
  ["factRecordsTerm", "factRecordsDetail"],
  ["factPipelineTerm", "factPipelineDetail"],
  ["factPagesTerm", "factPagesDetail"],
  ["factInterfaceTerm", "factInterfaceDetail"],
  ["factLanguageTerm", "factLanguageDetail"],
  ["factTestsTerm", "factTestsDetail"],
  ["factLicenceTerm", "factLicenceDetail"],
] as const;

const STEPS = [
  { index: "01", title: "stepGuideTitle", body: "stepGuideBody", command: null },
  { index: "02", title: "stepChangeTitle", body: "stepChangeBody", command: null },
  { index: "03", title: "stepChecksTitle", body: "stepChecksBody", command: "stepChecksCommand" },
] as const;

const TERMS = ["licenceFiction", "licenceAccounts", "licenceCookie", "licenceWarranty"] as const;

const QUESTIONS = [
  ["faqRealQ", "faqRealA"],
  ["faqWriteQ", "faqWriteA"],
  ["faqNotesQ", "faqNotesA"],
  ["faqReuseQ", "faqReuseA"],
  ["faqLanguageQ", "faqLanguageA"],
  ["faqRoadmapQ", "faqRoadmapA"],
] as const;

const CHANNELS = [
  {
    tone: "bug",
    icon: Bug,
    title: "channelBugTitle",
    body: "channelBugBody",
    action: "channelBugAction",
    href: ISSUES.bug,
  },
  {
    tone: "feature",
    icon: Lightbulb,
    title: "channelFeatureTitle",
    body: "channelFeatureBody",
    action: "channelFeatureAction",
    href: ISSUES.feature,
  },
  {
    tone: "contact",
    icon: Mail,
    title: "channelContactTitle",
    body: "channelContactBody",
    action: "channelContactAction",
    href: ISSUES.contact,
  },
] as const;

export function MetaPremise() {
  const t = useTranslations("meta");

  return (
    <section className="meta-section" id="premise" aria-labelledby="meta-premise-title">
      <div className="meta-shell meta-split">
        <SectionHead id="meta-premise-title" index={t("premiseIndex")} kicker={t("premiseKicker")} title={t("premiseTitle")} />
        <div className="meta-prose">
          <p>{t("premiseBody")}</p>
          <p>{t("premiseBodyTwo")}</p>
        </div>
      </div>

      {/*
        The thesis, set as a display quotation, with the seal plotted beside it in
        characters. The plate is drawn rather than photographed, so it belongs to
        the type around it and cannot be mistaken for a real artifact.
      */}
      <div className="meta-quote">
        <div className="meta-shell meta-quote-grid">
          <div className="meta-quote-body">
            <blockquote>
              <p>{t("quote")}</p>
            </blockquote>
            <p className="meta-quote-source">{t("quoteAttribution")}</p>
          </div>
          <figure className="meta-plate">
            <pre className="meta-plate-art" aria-hidden="true">
              {SEAL_PLATE}
            </pre>
            <figcaption>{t("plateCaption")}</figcaption>
          </figure>
        </div>
      </div>

      <div className="meta-shell meta-specimen-row">
        <div className="meta-specimen-caption">
          <p className="meta-kicker">{t("specimenLabel")}</p>
          <p className="meta-note">{t("specimenNote")}</p>
        </div>
        <article className="meta-specimen">
          <div className="meta-specimen-top">
            <p className="meta-specimen-code">{t("specimenCode")}</p>
            <p className="meta-specimen-status">{t("specimenMeta")}</p>
          </div>
          <h3 className="meta-specimen-title">{t("specimenTitle")}</h3>
          <blockquote className="meta-specimen-text">
            <p>{t("specimenText")}</p>
          </blockquote>
          <footer className="meta-specimen-foot">
            <Link className="meta-specimen-link" href="/site/records/CIRCA-S-03007">
              {t("specimenLink")}
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </footer>
        </article>
      </div>
    </section>
  );
}

export function MetaEditions() {
  const t = useTranslations("meta");

  return (
    <section className="meta-section" id="editions" aria-labelledby="meta-editions-title">
      <div className="meta-shell meta-split">
        <SectionHead id="meta-editions-title" index={t("editionsIndex")} kicker={t("editionsKicker")} title={t("editionsTitle")} />
        <p className="meta-lede-small">{t("editionsLede")}</p>
      </div>

      <div className="meta-shell">
        <EditionCards />
        <p className="meta-note meta-editions-note">{t("editionsNote")}</p>
      </div>
    </section>
  );
}

export function MetaBuilt() {
  const t = useTranslations("meta");

  return (
    <section className="meta-section" id="built" aria-labelledby="meta-built-title">
      <div className="meta-shell meta-split">
        <SectionHead id="meta-built-title" index={t("builtIndex")} kicker={t("builtKicker")} title={t("builtTitle")} />
        <div>
          <p className="meta-lede-small">{t("builtLede")}</p>
          <dl className="meta-ledger">
            {FACTS.map(([term, detail]) => (
              <div className="meta-ledger-row" key={term}>
                <dt>{t(term)}</dt>
                <dd>{t(detail)}</dd>
              </div>
            ))}
          </dl>
          <p className="meta-note">{t("builtNote")}</p>
        </div>
      </div>
    </section>
  );
}

export function MetaContribute() {
  const t = useTranslations("meta");

  return (
    <section className="meta-section" id="contribute" aria-labelledby="meta-contribute-title">
      <div className="meta-shell meta-split">
        <SectionHead
          id="meta-contribute-title"
          index={t("contributeIndex")}
          kicker={t("contributeKicker")}
          title={t("contributeTitle")}
        />
        <p className="meta-lede-small">{t("contributeLede")}</p>
      </div>

      <div className="meta-shell meta-contribute-body">
        <ol className="meta-steps">
          {STEPS.map((step) => (
            <li className="meta-step" key={step.index}>
              <p className="meta-step-index" aria-hidden="true">
                {step.index}
              </p>
              <h3>{t(step.title)}</h3>
              <p>{t(step.body)}</p>
              {step.command ? (
                <p className="meta-command">
                  <span aria-hidden="true">$</span>
                  <code>{t(step.command)}</code>
                </p>
              ) : null}
            </li>
          ))}
        </ol>

        <div className="meta-contribute-foot">
          <a className="meta-button" href={PROJECT_LINKS.repository} {...EXTERNAL}>
            {t("contributeRepository")}
            <ArrowUpRight size={15} aria-hidden="true" />
          </a>
          <p className="meta-note">{t("contributeNote")}</p>
        </div>
      </div>
    </section>
  );
}

export function MetaContributors() {
  const t = useTranslations("meta");

  return (
    <section className="meta-section" id="contributors" aria-labelledby="meta-contributors-title">
      <div className="meta-shell meta-split">
        <SectionHead
          id="meta-contributors-title"
          index={t("contributorsIndex")}
          kicker={t("contributorsKicker")}
          title={t("contributorsTitle")}
        />
        <div>
          <p className="meta-lede-small">{t("contributorsLede")}</p>

          <table className="meta-roster">
            <caption className="meta-sr">{t("contributorsKicker")}</caption>
            <thead>
              <tr>
                <th scope="col">{t("contributorsNameHead")}</th>
                <th scope="col">{t("contributorsRoleHead")}</th>
                <th scope="col">{t("contributorsWorkHead")}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">
                  <a href={PROJECT_LINKS.repository} {...EXTERNAL}>
                    {MAINTAINER}
                  </a>
                </th>
                <td>{t("contributorsMaintainerRole")}</td>
                <td>{t("contributorsMaintainerWork")}</td>
              </tr>
              <tr data-open="true">
                <th scope="row">{t("contributorsOpenName")}</th>
                <td>{t("contributorsOpenRole")}</td>
                <td>{t("contributorsOpenWork")}</td>
              </tr>
            </tbody>
          </table>

          <p className="meta-aside-link">
            <a href="#contribute">
              {t("contributorsLink")}
              <ArrowRight size={15} aria-hidden="true" />
            </a>
          </p>
          <p className="meta-note">{t("contributorsNote")}</p>
        </div>
      </div>
    </section>
  );
}

export function MetaSupport() {
  const t = useTranslations("meta");

  return (
    <section className="meta-section" id="support" aria-labelledby="meta-support-title">
      <div className="meta-shell meta-split">
        <SectionHead id="meta-support-title" index={t("supportIndex")} kicker={t("supportKicker")} title={t("supportTitle")} />
        <div>
          <p className="meta-lede-small">{t("supportBody")}</p>
          <div className="meta-support-card">
            <h3>{t("supportSponsorTitle")}</h3>
            <p>{t("supportSponsorBody")}</p>
            <a className="meta-button meta-button-ember" href={PROJECT_LINKS.sponsor} {...EXTERNAL}>
              {t("supportSponsorLink")}
              <ArrowUpRight size={15} aria-hidden="true" />
            </a>
            <p className="meta-note">{t("supportPromise")}</p>
          </div>
          <p className="meta-aside-link">
            <a href="#contribute">
              {t("supportContribute")}
              <ArrowRight size={15} aria-hidden="true" />
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

export function MetaQuestions() {
  const t = useTranslations("meta");

  return (
    <section className="meta-section" id="questions" aria-labelledby="meta-questions-title">
      <div className="meta-shell meta-split">
        <SectionHead
          id="meta-questions-title"
          index={t("faqIndex")}
          kicker={t("faqKicker")}
          title={t("faqTitle")}
        />
        <div>
          <p className="meta-lede-small">{t("faqLede")}</p>
          <div className="meta-faq">
            {QUESTIONS.map(([question, answer]) => (
              <details className="meta-faq-item" name="meta-questions" key={question}>
                <summary>{t(question)}</summary>
                <p>{t(answer)}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function MetaContact() {
  const t = useTranslations("meta");

  return (
    <section className="meta-section" id="contact" aria-labelledby="meta-contact-title">
      <div className="meta-shell meta-split">
        <SectionHead id="meta-contact-title" index={t("contactIndex")} kicker={t("contactKicker")} title={t("contactTitle")} />
        <p className="meta-lede-small">{t("contactLede")}</p>
      </div>

      <div className="meta-shell">
        <div className="meta-channels">
          {CHANNELS.map((channel) => {
            const Icon = channel.icon;
            return (
              <article className="meta-channel" data-tone={channel.tone} key={channel.tone}>
                <p className="meta-channel-icon" aria-hidden="true">
                  <Icon size={20} strokeWidth={1.5} />
                </p>
                <h3>{t(channel.title)}</h3>
                <p className="meta-channel-body">{t(channel.body)}</p>
                <a className="meta-channel-link" href={channel.href} {...EXTERNAL}>
                  {t(channel.action)}
                  <ArrowUpRight size={14} aria-hidden="true" />
                </a>
              </article>
            );
          })}
        </div>
        <p className="meta-note meta-contact-note">{t("contactNote")}</p>
      </div>
    </section>
  );
}

export function MetaLicence() {
  const t = useTranslations("meta");

  return (
    <section className="meta-section" id="licence" aria-labelledby="meta-licence-title">
      <div className="meta-shell meta-split">
        <SectionHead
          id="meta-licence-title"
          index={t("licenceIndex")}
          kicker={t("licenceKicker")}
          title={t("licenceTitle")}
        />
        <div>
          <p className="meta-lede-small">{t("licenceLede")}</p>

          <div className="meta-licences">
            <article className="meta-licence">
              <p className="meta-kicker">{t("licenceCodeLabel")}</p>
              <p className="meta-licence-name">
                <a href={LICENCES.code.href} {...EXTERNAL}>
                  {LICENCES.code.name}
                  <ArrowUpRight size={14} aria-hidden="true" />
                </a>
              </p>
              <p className="meta-licence-body">{t("licenceCodeBody")}</p>
            </article>
            <article className="meta-licence">
              <p className="meta-kicker">{t("licenceContentLabel")}</p>
              <p className="meta-licence-name">
                <a href={LICENCES.content.href} {...EXTERNAL}>
                  {LICENCES.content.name}
                  <ArrowUpRight size={14} aria-hidden="true" />
                </a>
              </p>
              <p className="meta-licence-body">{t("licenceContentBody")}</p>
            </article>
          </div>

          <div className="meta-terms" id="terms">
            <p className="meta-kicker">{t("licenceTermsLabel")}</p>
            <ul>
              {TERMS.map((term) => (
                <li key={term}>{t(term)}</li>
              ))}
            </ul>
            <p className="meta-note">{t("licenceFootnote")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
