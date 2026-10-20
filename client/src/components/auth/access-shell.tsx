import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "../language-switcher";
import { ArchiveButton } from "../archive-site/archive-button";
import archive from "../archive-site/archive-site.module.css";
import styles from "./auth.module.css";

export function AccessShell({ mode = "sign-in", title, intro, sidebar, children }: {
  mode?: "sign-in" | "sign-up" | "account";
  title: string;
  intro: string;
  sidebar?: React.ReactNode;
  children: React.ReactNode;
}) {
  const t = useTranslations("auth");
  const site = useTranslations("site");
  return <div className={`${archive.shell} ${styles.page}`}>
    <a href="#access-content" className={`${archive.skip} ${styles.skip}`}>{t("skip")}</a>
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link href="/site" className={archive.brand}>
          <span className={archive.brandMark} aria-hidden="true" />
          <span className={archive.brandText}><strong>{site("brandName")}</strong><small>{t("registry")}</small></span>
        </Link>
        <div className={styles.tools}>
          <LanguageSwitcher short />
          <ArchiveButton href="/site">{t("returnArchive")}</ArchiveButton>
        </div>
      </div>
    </header>
    <main id="access-content" tabIndex={-1} className={`${styles.register} ${sidebar ? styles.accountRegister : ""}`}>
      {sidebar ?? <aside className={styles.registryNote}>
        <p className={styles.kicker}>{t("accessRegister")}</p>
        <span className={`${archive.brandMark} ${styles.seal}`} aria-hidden="true" />
        <h2>{t("registryHeading")}</h2>
        <p className={styles.statement}>{t("registryStatement")}</p>
        <dl className={styles.instructions}>
          <div><dt>{t("publicReading")}</dt><dd>{t("publicReadingNote")}</dd></div>
          <div><dt>{t("personalRecord")}</dt><dd>{t("personalRecordNote")}</dd></div>
        </dl>
        <Link href="/site" className={styles.readLink}>{t("continueReading")} <span aria-hidden="true">↗</span></Link>
      </aside>}
      <div className={styles.sheet}>
        <div className={styles.filingLine}><span>{t(mode === "sign-up" ? "registrationForm" : mode === "account" ? "accountRecord" : "accessForm")}</span><span>{t("registryCopy")}</span></div>
        <div className={styles.sheetBody}>
          <p className={styles.kicker}>{t("registry")}</p>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.intro}>{intro}</p>
          {children}
        </div>
        <div className={styles.sheetFoot}>{t("credentialNote")}</div>
      </div>
    </main>
    <footer className={styles.footer}><span>{t("registry")}</span><span>{t("footer")}</span></footer>
  </div>;
}
