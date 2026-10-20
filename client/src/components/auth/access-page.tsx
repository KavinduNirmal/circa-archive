import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/routing";
import { getSessionState } from "@/lib/auth/session";
import { AccessShell } from "./access-shell";
import { AuthForm } from "./auth-form";
import { AccountRecord, AccountSidebar } from "./account-record";
import { ArchiveButton } from "../archive-site/archive-button";

export async function AccessPage({ mode, locale }: { mode: "sign-in" | "sign-up" | "account"; locale: Locale }) {
  const state = await getSessionState();
  if (mode !== "account" && state.status === "authenticated") redirect(`/${locale}/account`);
  if (mode === "account" && state.status === "guest") redirect(`/${locale}/sign-in`);
  const t = await getTranslations({ locale, namespace: "auth" });

  if (state.status === "unavailable") {
    return <AccessShell mode={mode} title={t("serviceTitle")} intro={t("serviceBody")}>
      <ArchiveButton tone="paper" raw href={`/${locale}/${mode}`}>{t("retry")}</ArchiveButton>
    </AccessShell>;
  }
  if (mode === "account" && state.status === "authenticated") {
    return <AccessShell mode={mode} title={t("personalAccess")} intro={t("accountIntro")} sidebar={<AccountSidebar />}>
      <AccountRecord account={state.account} locale={locale} />
    </AccessShell>;
  }
  return <AccessShell mode={mode} title={t(mode === "sign-up" ? "signUp" : "signIn")} intro={t(mode === "sign-up" ? "signUpIntro" : "signInIntro")}>
    <AuthForm mode={mode === "sign-up" ? "sign-up" : "sign-in"} />
  </AccessShell>;
}
