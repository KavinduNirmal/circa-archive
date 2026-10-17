import { ArrowUp } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "../language-switcher";
import { EXTERNAL, ISSUES, LICENCES, PROJECT_LINKS } from "./meta-links";
import { MetaNav, type MetaNavGroup, type MetaNavLabels } from "./meta-nav";
import { DOC_GROUPS, DOC_TOPICS, docHref, docTopic } from "./docs/docs-topics";

/**
 * The frame shared by every page outside the fiction: the instrument strip, the
 * project navigation, the field behind the content, and the footer.
 *
 * The chrome is a server component. The two client islands are the navigation
 * (a shadcn NavigationMenu and a Sheet) and the language switcher; both receive
 * their labels as props, so the meta catalog is not shipped to the browser.
 */
export async function MetaChrome({
  lang,
  children,
}: Readonly<{ lang: string; children: React.ReactNode }>) {
  const t = await getTranslations({ locale: lang, namespace: "meta" });

  const navLabels: MetaNavLabels = {
    brand: t("brand"),
    brandTail: "Archive",
    menu: t("navMenu"),
    menuLabel: t("navMenuLabel"),
    close: t("navClose"),
    home: t("navHome"),
    docs: t("navDocs"),
    docsHint: t("navDocsOverview"),
    about: t("navAbout"),
    archive: t("navArchiveLink"),
    workstation: t("navWorkstation"),
    archiveCta: t("navOpenArchive"),
    sourceCta: t("navSource"),
    skip: t("skip"),
  };

  const groups: MetaNavGroup[] = DOC_GROUPS.map((group) => ({
    label: t(group.labelKey),
    items: group.slugs.map((slug) => {
      const topic = docTopic(slug)!;
      return { label: t(topic.navKey), href: docHref(slug) };
    }),
  }));

  const footerDocs = DOC_TOPICS.filter((topic) => ["overview", "getting-started", "records", "contributing"].includes(topic.slug));

  return (
    <div className="meta-page" id="top">
      <a className="meta-skip" href="#meta-content">
        {t("skip")}
      </a>

      <div className="meta-topline">
        <div className="meta-shell meta-topline-inner">
          <p className="meta-topline-left">
            <span className="meta-topline-brand">CIRCA Archive</span>
            <span className="meta-topline-sep" aria-hidden="true">
              /
            </span>
            <span>{t("kicker")}</span>
          </p>
          <p className="meta-topline-right">
            <span className="meta-status-dot" aria-hidden="true" />
            <span>{t("statusLine")}</span>
            <span className="meta-topline-sep" aria-hidden="true">
              /
            </span>
            <span>{t("statusValue")}</span>
          </p>
        </div>
      </div>

      <MetaNav labels={navLabels} groups={groups} repositoryUrl={PROJECT_LINKS.repository} />

      <main id="meta-content">
        <div className="meta-frame">{children}</div>
      </main>

      <footer className="meta-footer">
        <div className="meta-shell meta-footer-top">
          <div className="meta-footer-brand">
            <p className="meta-footer-word">
              <span>CIRCA</span>
              <span>Archive</span>
            </p>
            <p className="meta-footer-tagline">{t("footerTagline")}</p>
            <p className="meta-footer-status">
              <span className="meta-status-dot" aria-hidden="true" />
              {t("statusLine")}
            </p>
            <LanguageSwitcher className="meta-language meta-footer-language" />
          </div>

          <nav className="meta-footer-nav" aria-label={t("footerNav")}>
            <div>
              <p className="meta-footer-title">{t("footerProjectTitle")}</p>
              <ul>
                <li>
                  <Link href="/meta">{t("footerHome")}</Link>
                </li>
                <li>
                  <Link href="/meta/about">{t("footerAbout")}</Link>
                </li>
                <li>
                  <Link href="/meta/about#premise">{t("footerPremise")}</Link>
                </li>
                <li>
                  <Link href="/meta/about#contributors">{t("footerContributors")}</Link>
                </li>
                <li>
                  <Link href="/meta/about#licence">{t("footerLicence")}</Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="meta-footer-title">{t("footerDocsTitle")}</p>
              <ul>
                {footerDocs.map((topic) => (
                  <li key={topic.slug}>
                    <Link href={docHref(topic.slug)}>{t(topic.navKey)}</Link>
                  </li>
                ))}
                <li>
                  <a href={PROJECT_LINKS.repository} {...EXTERNAL}>
                    {t("footerSource")}
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <p className="meta-footer-title">{t("footerArchiveTitle")}</p>
              <ul>
                <li>
                  <Link href="/site">{t("footerArchive")}</Link>
                </li>
                <li>
                  <Link href="/site/records">{t("footerRecords")}</Link>
                </li>
                <li>
                  <Link href="/site/organizations">{t("footerOrganizations")}</Link>
                </li>
                <li>
                  <Link href="/desktop">{t("footerWorkstation")}</Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="meta-footer-title">{t("footerHelpTitle")}</p>
              <ul>
                <li>
                  <a href={ISSUES.bug} {...EXTERNAL}>
                    {t("footerBug")}
                  </a>
                </li>
                <li>
                  <a href={ISSUES.feature} {...EXTERNAL}>
                    {t("footerFeature")}
                  </a>
                </li>
                <li>
                  <a href={ISSUES.contact} {...EXTERNAL}>
                    {t("footerContactLink")}
                  </a>
                </li>
                <li>
                  <a href={PROJECT_LINKS.sponsor} {...EXTERNAL}>
                    {t("footerSponsor")}
                  </a>
                </li>
              </ul>
            </div>
          </nav>
        </div>

        <div className="meta-shell meta-footer-legal">
          <p className="meta-footer-fiction">{t("footerFiction")}</p>
          <nav className="meta-footer-legal-links" aria-label={t("footerLegalNav")}>
            <a href={LICENCES.code.href} {...EXTERNAL}>
              {t("footerCodeLicence")}
            </a>
            <a href={LICENCES.content.href} {...EXTERNAL}>
              {t("footerContentLicence")}
            </a>
            <Link href="/meta/about#terms">{t("footerTerms")}</Link>
            <a className="meta-footer-top-link" href="#top">
              {t("top")}
              <ArrowUp aria-hidden="true" size={12} />
            </a>
          </nav>
          <p className="meta-footer-copy">{t("footerCopyright")}</p>
        </div>
      </footer>

    </div>
  );
}
