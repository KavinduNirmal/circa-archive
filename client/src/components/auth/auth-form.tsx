"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { authFetch } from "@/lib/auth/client";
import { ArrowRight, RotateCw } from "lucide-react";
import { ArchiveButton } from "../archive-site/archive-button";
import styles from "./auth.module.css";

type ErrorCode =
  | "invalid_credentials"
  | "locked"
  | "rate_limit_exceeded"
  | "validation_failed"
  | "username_taken"
  | "email_taken"
  | "unavailable";
const errorCodes: readonly string[] = [
  "invalid_credentials",
  "locked",
  "rate_limit_exceeded",
  "validation_failed",
  "username_taken",
  "email_taken",
];

async function previewName(signal?: AbortSignal): Promise<{
  displayName?: string;
  error?: "rate_limit_exceeded" | "nameUnavailable";
}> {
  try {
    const timeout = AbortSignal.timeout(5000);
    const response = await authFetch("/api/v1/auth/display-name", {
      cache: "no-store",
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
    if (response.status === 429) return { error: "rate_limit_exceeded" };
    if (!response.ok) return { error: "nameUnavailable" };
    const value: { displayName?: unknown } = await response.json();
    return typeof value.displayName === "string" && value.displayName.trim()
      ? { displayName: value.displayName }
      : { error: "nameUnavailable" };
  } catch {
    return { error: "nameUnavailable" };
  }
}

export function AuthForm({
  mode,
  onSuccess,
}: {
  mode: "sign-in" | "sign-up";
  onSuccess?: () => void;
}) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const registration = mode === "sign-up";
  const [identity, setIdentity] = useState<{
    loading: boolean;
    displayName?: string;
    error?: "rate_limit_exceeded" | "nameUnavailable";
  }>({ loading: registration });
  useEffect(() => {
    if (!registration) return;
    const controller = new AbortController();
    void previewName(controller.signal).then((result) => {
      if (!controller.signal.aborted)
        setIdentity({ ...result, loading: false });
    });
    return () => controller.abort();
  }, [registration]);

  async function rerollName() {
    if (identity.loading || inFlight.current) return;
    setIdentity((current) => ({ ...current, loading: true, error: undefined }));
    const result = await previewName();
    setIdentity((current) => ({ ...current, ...result, loading: false }));
  }

  const [pending, setPending] = useState(false);
  const inFlight = useRef(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<ErrorCode>();
  const notice = useRef<HTMLParagraphElement>(null);
  const duplicateField =
    error === "username_taken"
      ? "username"
      : error === "email_taken"
        ? "email"
        : undefined;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current || identity.loading) return;
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new window.FormData(form);
    const body = registration
      ? {
          username: data.get("username"),
          email: data.get("email"),
          password: data.get("password"),
          ...(identity.displayName
            ? { displayName: identity.displayName }
            : {}),
        }
      : { identifier: data.get("identifier"), password: data.get("password") };
    inFlight.current = true;
    setPending(true);
    setError(undefined);
    try {
      const response = await authFetch(
        `/api/v1/auth/${registration ? "register" : "login"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (response.ok) {
        if (onSuccess) onSuccess();
        // The API changes cookies outside Next actions: reload the server session and router cache.
        else
          window.location.assign(
            new URL(`/${locale}/account`, window.location.origin).href,
          );
        return;
      }
      const problem: { code?: string } = await response
        .json()
        .catch(() => ({}));
      setError(
        errorCodes.includes(problem.code ?? "")
          ? (problem.code as ErrorCode)
          : "unavailable",
      );
    } catch {
      setError("unavailable");
    } finally {
      inFlight.current = false;
      setPending(false);
    }
    // Focus the failure after React has committed the notice, without clearing fields.
    requestAnimationFrame(() => notice.current?.focus());
  }

  return (
    <form
      onSubmit={submit}
      aria-busy={pending}
      className={styles.form}
      onInvalid={(event) => {
        const input = event.target as HTMLInputElement;
        input.setCustomValidity(
          t(
            input.validity.valueMissing
              ? "required"
              : input.validity.typeMismatch
                ? "invalidEmail"
                : input.name === "username"
                  ? "usernameHint"
                  : input.name === "password" && registration
                    ? "passwordHint"
                    : "validation_failed",
          ),
        );
      }}
      onInput={(event) => {
        (event.target as HTMLInputElement).setCustomValidity("");
      }}
    >
      <fieldset disabled={pending}>
        <legend className={styles.sectionLabel}>
          <span aria-hidden="true">01 / </span>
          {t("credentials")}
        </legend>
        {registration ? (
          <>
            <div className={styles.field}>
              <label htmlFor="auth-username">{t("username")}</label>
              <input
                id="auth-username"
                name="username"
                autoComplete="username"
                required
                minLength={3}
                maxLength={20}
                pattern="[A-Za-z0-9_]{3,20}"
                autoCapitalize="none"
                spellCheck={false}
                aria-invalid={duplicateField === "username" || undefined}
                aria-describedby={`auth-username-hint${duplicateField === "username" ? " auth-username-error" : ""}`}
              />
              <p id="auth-username-hint" className={styles.hint}>
                {t("usernameHint")}
              </p>
              {duplicateField === "username" && (
                <p id="auth-username-error" className={styles.fieldError}>
                  {t("username_taken")}
                </p>
              )}
            </div>
            <div className={styles.field}>
              <label htmlFor="auth-email">{t("email")}</label>
              <input
                id="auth-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                autoCapitalize="none"
                spellCheck={false}
                aria-invalid={duplicateField === "email" || undefined}
                aria-describedby={
                  duplicateField === "email" ? "auth-email-error" : undefined
                }
              />
              {duplicateField === "email" && (
                <p id="auth-email-error" className={styles.fieldError}>
                  {t("email_taken")}
                </p>
              )}
            </div>
          </>
        ) : (
          <div className={styles.field}>
            <label htmlFor="auth-identifier">{t("identifier")}</label>
            <input
              id="auth-identifier"
              name="identifier"
              autoComplete="username"
              required
              autoCapitalize="none"
              spellCheck={false}
            />
          </div>
        )}
        <div className={styles.field}>
          <label htmlFor="auth-password">{t("password")}</label>
          <input
            id="auth-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete={registration ? "new-password" : "current-password"}
            required
            minLength={registration ? 8 : undefined}
            pattern={
              registration
                ? "(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}"
                : undefined
            }
            aria-describedby={registration ? "auth-password-hint" : undefined}
          />
          {registration && (
            <p id="auth-password-hint" className={styles.hint}>
              {t("passwordHint")}
            </p>
          )}
        </div>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={showPassword}
            onChange={(event) => setShowPassword(event.target.checked)}
          />
          {t("showPassword")}
        </label>
        {registration && (
          <section
            className={styles.identity}
            aria-labelledby="analyst-title"
            aria-busy={identity.loading}
          >
            <h2 id="analyst-title" className={styles.sectionLabel}>
              <span aria-hidden="true">02 / </span>
              {t("archiveIdentity")}
            </h2>
            <div className={styles.identityRow}>
              <div>
                <p className={styles.hint}>{t("displayName")}</p>
                <p className={styles.analystName} role="status">
                  {identity.displayName ??
                    t(
                      identity.loading
                        ? "nameLoading"
                        : "assignedOnRegistration",
                    )}
                </p>
              </div>
              <ArchiveButton
                tone="paper"
                disabled={identity.loading}
                onClick={rerollName}
                icon={<RotateCw size={14} aria-hidden="true" />}
              >
                {t(identity.loading ? "pending" : "rerollName")}
              </ArchiveButton>
            </div>
            <p className={styles.hint}>{t("identityHint")}</p>
            {identity.error && (
              <p role="alert" className={styles.fieldError}>
                {t(identity.error)}
              </p>
            )}
          </section>
        )}
        <ArchiveButton
          tone="paper"
          type="submit"
          disabled={pending || identity.loading}
          icon={<ArrowRight size={16} aria-hidden="true" />}
          className={styles.submit}
        >
          {t(pending ? "pending" : registration ? "signUp" : "signIn")}
        </ArchiveButton>
      </fieldset>
      {error && (
        <p ref={notice} role="alert" tabIndex={-1} className={styles.notice}>
          {t(error)}
        </p>
      )}
      <p className={styles.alternate}>
        {t(registration ? "existingAccount" : "newAccount")}{" "}
        <Link href={registration ? "/sign-in" : "/sign-up"}>
          {t(registration ? "signIn" : "signUp")}
        </Link>
      </p>
    </form>
  );
}
