"use client";

import { useTranslations } from "next-intl";
import { Popover } from "radix-ui";
import { useState } from "react";
import { explorationsFor } from "./reader-correspondence";
import { updatesFor } from "./record-updates";

/**
 * The record's two status-bar accounts: its filed status updates, and the
 * explorations filed against it.
 *
 * Both are deliberately off the sheet. A reader who came to read should not
 * meet a changelog in the body, so each count is a small control in the status
 * bar and the history opens above it. The two are separate controls because
 * they answer different questions: what happened to this record, and what has
 * been filed against it.
 *
 * An exploration row hands its code to the reader's own record opener, so an
 * exploration opens as a record and not as a second, special reading surface.
 */
export function RecordStatusCells({ code, onOpenRecord }: {
  code: string;
  onOpenRecord: (code: string) => void;
}) {
  const t = useTranslations("reader");
  const updates = updatesFor(code);
  const explorations = explorationsFor(code);
  const [explorationsOpen, setExplorationsOpen] = useState(false);

  if (updates.length === 0 && explorations.length === 0) return null;

  return (
    <>
      {updates.length > 0 ? (
        <Popover.Root>
          <Popover.Trigger className="reader-status-cell reader-status-action">
            {t("updatesCount", { count: updates.length })}
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              className="reader-status-panel circa-raised"
              side="top"
              align="end"
              sideOffset={6}
              aria-label={t("updatesTitle")}
            >
              <p className="reader-status-panel-title">{t("updatesTitle")}</p>
              <ol className="reader-status-updates">
                {updates.map((update) => (
                  <li key={`${update.filed}-${update.text}`} data-tone={update.tone}>
                    <time dateTime={update.filed}>{update.filed}</time>
                    <span>{update.text}</span>
                  </li>
                ))}
              </ol>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      ) : null}

      {explorations.length > 0 ? (
        <Popover.Root open={explorationsOpen} onOpenChange={setExplorationsOpen}>
          <Popover.Trigger className="reader-status-cell reader-status-action">
            {t("explorationsCount", { count: explorations.length })}
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              className="reader-status-panel circa-raised"
              side="top"
              align="end"
              sideOffset={6}
              aria-label={t("explorationsTitle")}
            >
              <p className="reader-status-panel-title">{t("explorationsTitle")}</p>
              <ul className="reader-status-explorations">
                {explorations.map((item) => (
                  <li key={item.code}>
                    <button
                      type="button"
                      className="reader-status-record"
                      aria-label={t("openExploration", { code: item.code })}
                      onClick={() => {
                        onOpenRecord(item.code);
                        setExplorationsOpen(false);
                      }}
                    >
                      <span className="reader-status-record-code circa-mono">{item.code}</span>
                      <span className="reader-status-record-org">{item.organization}</span>
                      <span className="reader-status-record-preview">{item.preview}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      ) : null}
    </>
  );
}
