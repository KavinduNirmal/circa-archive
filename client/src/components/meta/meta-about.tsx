import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "../language-switcher";
import "./meta.css";

/**
 * The project page: the one page on the site that is not the fiction.
 *
 * It is deliberately plain. The public archive speaks as the Commission; this
 * page speaks as the project, and says what the Commission is, what is invented,
 * what the two editions are, and what is not being collected. The "About the
 * site" button in the archive's masthead is the only door here, and the page
 * calls itself what it is in its kicker rather than pretending to be a record.
 */
const SECTIONS = [
  ["whatTitle", "whatBody"],
  ["fictionTitle", "fictionBody"],
  ["editionsTitle", "editionsBody"],
  ["builtTitle", "builtBody"],
  ["honestyTitle", "honestyBody"],
  ["accessTitle", "accessBody"],
  ["creditsTitle", "creditsBody"],
] as const;

export function MetaAbout() {
  const t = useTranslations("meta");

  return (
    <div className="meta-page" id="top">
      <a className="meta-skip" href="#meta-content">{t("skip")}</a>

      <header className="meta-topbar">
        <div className="meta-topbar-inner">
          <Link className="meta-brand" href="/site">{t("brand")}</Link>
          <p className="meta-kicker">{t("kicker")}</p>
          <div className="meta-tools">
            <LanguageSwitcher />
            <Link className="meta-back" href="/site">{t("backArchive")} <span aria-hidden="true">»</span></Link>
          </div>
        </div>
      </header>

      <main className="meta-main" id="meta-content">
        <p className="meta-outside">{t("outside")}</p>
        <h1 className="meta-title">{t("title")}</h1>
        <p className="meta-lede">{t("lede")}</p>

        <p className="meta-links">
          <Link href="/site">{t("backArchive")} <span aria-hidden="true">»</span></Link>
          <Link href="/">{t("backPortal")} <span aria-hidden="true">»</span></Link>
          <Link href="/desktop">{t("backWorkstation")} <span aria-hidden="true">»</span></Link>
        </p>

        {SECTIONS.map(([title, body]) => (
          <section className="meta-section" key={title}>
            <h2>{t(title)}</h2>
            <p>{t(body)}</p>
          </section>
        ))}
      </main>

      <footer className="meta-footer">
        <p>{t("footer")}</p>
        <a href="#top">{t("top")}</a>
      </footer>
    </div>
  );
}
