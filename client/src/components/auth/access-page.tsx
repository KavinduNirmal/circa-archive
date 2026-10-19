import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/routing";
import { getSessionState } from "@/lib/auth/session";
import { AccessShell } from "./access-shell";
import { AuthForm } from "./auth-form";
import { SignOutButton } from "./sign-out-button";
import { ArchiveButton } from "../archive-site/archive-button";
import styles from "./auth.module.css";

export async function AccessPage({ mode, locale }: { mode: "sign-in" | "sign-up" | "account"; locale: Locale }) {
  const state = await getSessionState();
  if (mode !== "account" && state.status === "authenticated") redirect(`/${locale}/account`);
  if (mode === "account" && state.status === "guest") redirect(`/${locale}/sign-in`);
  const t = await getTranslations({ locale, namespace: "auth" });

  if (state.status === "unavailable") {
    return <AccessShell title={t("serviceTitle")} intro={t("serviceBody")}>
      <ArchiveButton tone="paper" raw href={`/${locale}/${mode}`}>{t("retry")}</ArchiveButton>
    </AccessShell>;
  }
  if (mode === "account" && state.status === "authenticated") {
    return <AccessShell title={t("personalAccess")} intro={t("accountIntro")}>
      <dl className={styles.particulars}>
        <div><dt>{t("username")}</dt><dd>{state.account.username}</dd></div>
        <div><dt>{t("role")}</dt><dd>{t(state.account.role === "moderator" ? "roleModerator" : "roleAuthor")}</dd></div>
      </dl>
      <SignOutButton />
    </AccessShell>;
  }
  return <AccessShell title={t(mode === "sign-up" ? "signUp" : "signIn")} intro={t(mode === "sign-up" ? "signUpIntro" : "signInIntro")}>
    <AuthForm mode={mode === "sign-up" ? "sign-up" : "sign-in"} />
  </AccessShell>;
}
