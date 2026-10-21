"use client";

import { useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { authFetch } from "@/lib/auth/client";
import { ArchiveButton } from "../archive-site/archive-button";
import styles from "./auth.module.css";

export function SignOutButton({ onSuccess }: { onSuccess?: () => void }) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const inFlight = useRef(false);

  async function signOut() {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setFailed(false);
    try {
      const response = await authFetch("/api/v1/auth/logout", {
        method: "POST",
      });
      if (!response.ok) throw new Error("logout_failed");
      if (onSuccess) onSuccess();
      else
        window.location.assign(
          new URL(`/${locale}/site`, window.location.origin).href,
        );
    } catch {
      setFailed(true);
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  return (
    <div>
      <ArchiveButton tone="paper" onClick={signOut} disabled={pending}>
        {t(pending ? "pending" : "signOut")}
      </ArchiveButton>
      {failed && (
        <p role="alert" className={styles.notice}>
          {t("unavailable")}
        </p>
      )}
    </div>
  );
}
