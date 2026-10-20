import { useTranslations } from "next-intl";
import type { Account } from "@/lib/auth/session";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { SignOutButton } from "./sign-out-button";
import archive from "../archive-site/archive-site.module.css";
import styles from "./account.module.css";

export function AccountSidebar() {
  const t = useTranslations("auth");
  return <aside className={styles.sidebar}>
    <p className={styles.kicker}>{t("accountRecord")}</p>
    <span className={`${archive.brandMark} ${styles.seal}`} aria-hidden="true" />
    <h2>{t("yourRegistration")}</h2>
    <p className={styles.sidebarIntro}>{t("accountIndexIntro")}</p>
    <nav aria-label={t("accountSections")} className={styles.index}>
      <a href="#archive-identity"><span aria-hidden="true">01</span>{t("archiveIdentity")}</a>
      <a href="#account-details"><span aria-hidden="true">02</span>{t("accountDetails")}</a>
      <a href="#session-access"><span aria-hidden="true">03</span>{t("sessionAccess")}</a>
    </nav>
    <Link href="/site" className={styles.readLink}>{t("continueReading")} <span aria-hidden="true">↗</span></Link>
  </aside>;
}

export function AccountRecord({ account, locale }: { account: Account; locale: Locale }) {
  const t = useTranslations("auth");
  const createdAt = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" }).format(new Date(account.createdAt));
  return <div className={styles.record}>
    <section id="archive-identity" aria-label={t("archiveIdentity")}>
      <h2><span aria-hidden="true">01 / </span>{t("archiveIdentity")}</h2>
      <p className={styles.description}>{t("identityDetails")}</p>
      <dl className={styles.details}>
        <div><dt>{t("displayName")}</dt><dd className={styles.analystName}>{account.displayName}</dd></div>
        <div><dt>{t("displayId")}</dt><dd>{account.displayId}</dd></div>
        <div><dt>{t("displayEmail")}</dt><dd>{account.displayEmail}</dd></div>
        <div><dt>{t("organization")}</dt><dd>{account.adoptedOrganizationId ?? "my.circa.archive"}</dd></div>
      </dl>
    </section>
    <section id="account-details" aria-label={t("accountDetails")}>
      <h2><span aria-hidden="true">02 / </span>{t("accountDetails")}</h2>
      <dl className={styles.details}>
        <div><dt>{t("username")}</dt><dd>{account.username}</dd></div>
        <div><dt>{t("role")}</dt><dd>{t(account.role === "moderator" ? "roleModerator" : "roleAuthor")}</dd></div>
        <div><dt>{t("registeredAt")}</dt><dd><time dateTime={account.createdAt}>{createdAt}</time></dd></div>
        <div><dt>{t("accountId")}</dt><dd>{account.id}</dd></div>
      </dl>
    </section>
    <section id="session-access" aria-label={t("sessionAccess")}>
      <h2><span aria-hidden="true">03 / </span>{t("sessionAccess")}</h2>
      <p className={styles.description}>{t("sessionDetails")}</p>
      <SignOutButton />
    </section>
  </div>;
}
