"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { ArchiveButton } from "../archive-site/archive-button";
import styles from "./cookie-notice.module.css";

const changed = "circa-cookie-notice-changed";
function subscribe(callback: () => void) {
  window.addEventListener(changed, callback);
  window.addEventListener("focus", callback);
  return () => {
    window.removeEventListener(changed, callback);
    window.removeEventListener("focus", callback);
  };
}
function acknowledged() {
  try {
    return document.cookie
      .split(";")
      .some((cookie) => cookie.trim() === "circa_cookie_notice=v1");
  } catch {
    return false;
  }
}

export function CookieNotice() {
  const t = useTranslations("auth");
  const saved = useSyncExternalStore(subscribe, acknowledged, () => true);
  const [dismissed, setDismissed] = useState(false);
  const notice = useRef<HTMLElement>(null);
  const visible = !saved && !dismissed;

  useEffect(() => {
    if (!visible || !notice.current) return;
    const root = document.documentElement;
    const update = () =>
      root.style.setProperty(
        "--circa-cookie-notice-height",
        `${notice.current?.getBoundingClientRect().height ?? 0}px`,
      );
    update();
    const observer = new ResizeObserver(update);
    observer.observe(notice.current);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--circa-cookie-notice-height");
    };
  }, [visible]);

  function dismiss() {
    try {
      document.cookie = `circa_cookie_notice=v1; Max-Age=31536000; Path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    } catch {
      // A blocked preference cookie must not prevent dismissal for this page.
    }
    setDismissed(true);
    window.dispatchEvent(new Event(changed));
  }

  if (!visible) return null;
  return (
    <aside
      ref={notice}
      role="region"
      aria-label={t("cookieNotice")}
      className={styles.notice}
    >
      <div className={styles.inner}>
        <p className={styles.label}>{t("cookieNotice")}</p>
        <div className={styles.copy}>
          <p>{t("cookieBody")}</p>
          <details>
            <summary>{t("cookieDetails")}</summary>
            <p>{t("cookieInventory")}</p>
          </details>
        </div>
        <ArchiveButton onClick={dismiss}>{t("cookieUnderstood")}</ArchiveButton>
      </div>
    </aside>
  );
}
