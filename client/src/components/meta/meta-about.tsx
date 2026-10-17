import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { MAINTAINER, PROJECT_LINKS } from "./meta-links";
import {
  MetaBuilt,
  MetaContact,
  MetaContribute,
  MetaContributors,
  MetaEditions,
  MetaLicence,
  MetaPremise,
  MetaQuestions,
  MetaSupport,
} from "./meta-sections";

/**
 * The dossier: the long account of what CIRCA Archive is.
 *
 * It was the whole project page when that page also had to be the front door.
 * Now the front page makes the argument and this page holds the receipts: the
 * premise in full, the editions, the build, how to contribute, who is on file,
 * how the work is funded, every question, the three ways to write, and the two
 * licences. It is allowed to be long, because a reader arrives here on purpose.
 */

const ABOUT_SECTIONS = [
  ["navPremise", "premise"],
  ["navEditions", "editions"],
  ["navBuilt", "built"],
  ["navContribute", "contribute"],
  ["navContributors", "contributors"],
  ["navSupport", "support"],
  ["navQuestions", "questions"],
  ["navContact", "contact"],
  ["navLicence", "licence"],
] as const;

export function MetaAbout() {
  const t = useTranslations("meta");

  return (
    <>
      <section className="meta-intro" aria-labelledby="meta-about-title">
        <div className="meta-shell meta-intro-inner meta-intro-grid">
          <div className="meta-intro-main">
            <nav className="meta-breadcrumb" aria-label={t("breadcrumbLabel")}>
              <Link href="/meta">{t("brand")}</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">{t("navAbout")}</span>
            </nav>

            <p className="meta-eyebrow">
              <span>{t("outside")}</span>
              <span className="meta-eyebrow-rule" aria-hidden="true" />
              <span>{t("aboutPageKicker")}</span>
            </p>

            <h1 className="meta-display meta-display-intro" id="meta-about-title">
              <span>{t("aboutPageTitleA")}</span>{" "}
              <span className="meta-display-dim">{t("aboutPageTitleB")}</span>
            </h1>

            <p className="meta-hero-lede">{t("aboutPageLede")}</p>

            <div className="meta-actions">
              <Link className="meta-button" href="/meta/documentation">
                {t("heroPrimary")}
                <ArrowRight aria-hidden="true" size={15} />
              </Link>
              <Link className="meta-button-outline" href="/site">
                {t("heroSecondary")}
                <ArrowUpRight aria-hidden="true" size={14} />
              </Link>
              <a className="meta-text-link" href={PROJECT_LINKS.repository} target="_blank" rel="noreferrer">
                {t("heroSource")}
                <ArrowUpRight aria-hidden="true" size={13} />
              </a>
            </div>
          </div>

          <aside className="meta-intro-register">
            <p className="meta-kicker">{t("kicker")}</p>

            <dl className="meta-intro-facts">
              <div>
                <dt>{t("aboutFactStatusTerm")}</dt>
                <dd>{t("aboutFactStatusValue")}</dd>
              </div>
              <div>
                <dt>{t("aboutFactMaintainerTerm")}</dt>
                <dd>{MAINTAINER}</dd>
              </div>
              <div>
                <dt>{t("aboutFactLicenceTerm")}</dt>
                <dd>MIT · CC BY-NC-SA 4.0</dd>
              </div>
            </dl>

            <nav className="meta-about-index" aria-label={t("aboutIndexLabel")}>
              <ol>
                {ABOUT_SECTIONS.map(([label, id], index) => (
                  <li key={id}>
                    <a href={`#${id}`}>
                      <span className="meta-about-index-number">{String(index + 1).padStart(2, "0")}</span>
                      {t(label)}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>
        </div>
      </section>

      <MetaPremise />
      <MetaEditions />
      <MetaBuilt />
      <MetaContribute />
      <MetaContributors />
      <MetaSupport />
      <MetaQuestions />
      <MetaContact />
      <MetaLicence />
    </>
  );
}
