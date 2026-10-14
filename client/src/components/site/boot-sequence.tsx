"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { ARCHIVE_INDEX } from "../browser/archive-index";
import { DesktopIcon } from "../desktop-icons";
import { FILE_TREE } from "../files/files-index";
import { MAILBOX_FIXTURE, folderMessages } from "../mail/mailbox-index";

/**
 * The power-on screen between the public landing page and the workstation.
 *
 * The desktop mounts behind it and stays inert until the post passes, so the
 * handover is a reveal rather than a page load. The lines report what the shell
 * actually mounted (the file index, the mail spool, the archive index) instead
 * of decorative numbers, which is also what the boot test checks.
 */

export type BootLine = { label: string; detail: string };

/** One line per step, then a hold on the final line before the shell takes over. */
export const BOOT_STEP_MS = 260;
export const BOOT_HOLD_MS = 520;

export function bootLines(): readonly BootLine[] {
  const records = FILE_TREE.filter((node) => node.kind === "file").length;
  const folders = FILE_TREE.length - records;
  const letters = folderMessages(MAILBOX_FIXTURE, "inbox").length;
  return [
    { label: "CIRCA/OS 4.12", detail: "post passed" },
    {
      label: "VOLUME C:",
      detail: `${FILE_TREE.length} nodes indexed, ${folders} folders, ${records} records`,
    },
    { label: "VOLUME D:", detail: "record store mounted read only" },
    { label: "MAIL SPOOL", detail: `${letters} letters waiting` },
    { label: "ARCHIVE INDEX", detail: `${ARCHIVE_INDEX.length} entries on file` },
    { label: "CLEARANCE", detail: "ANALYST, TERMINAL 04" },
    { label: "SHELL", detail: "workstation ready" },
  ];
}

export function bootDurationMs(): number {
  return BOOT_STEP_MS * (bootLines().length + 1) + BOOT_HOLD_MS;
}

/** Reads the media query without assuming the environment implements it. */
function motionReduced(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

const PROGRESS_CELLS = 44;

function BootScreen({ lines, revealed, onSkip }: {
  lines: readonly BootLine[];
  revealed: number;
  onSkip: () => void;
}) {
  const filled = Math.round((revealed / lines.length) * PROGRESS_CELLS);
  return (
    <div className="boot" role="region" aria-label="Workstation boot">
      <div className="boot-panel circa-raised">
        <div className="boot-head">
          {/* The same workstation mark the desktop wears, so the boot reads as this machine. */}
          <DesktopIcon icon={{ glyph: "my-pc" }} className="boot-seal" />
          <div className="boot-headline">
            <p className="boot-title">CIRCA/OS 4.12</p>
            <p className="boot-sub">Commission for Incident Review and Corrective Action</p>
          </div>
          <span className="boot-badge">Boot</span>
        </div>
        <ol className="boot-lines">
          {lines.map((line, index) => (
            <li key={line.label} className="boot-line" data-revealed={index < revealed ? "true" : "false"}>
              <span className="boot-label circa-mono">{line.label}</span>
              <span className="boot-detail circa-mono">{line.detail}</span>
              <span className="boot-mark circa-mono" aria-hidden="true">
                {index < revealed ? "ok" : ""}
              </span>
            </li>
          ))}
        </ol>
        <div
          className="boot-progress"
          role="progressbar"
          aria-label="Boot progress"
          aria-valuemin={0}
          aria-valuemax={lines.length}
          aria-valuenow={revealed}
          aria-valuetext={`${revealed} of ${lines.length} checks`}
        >
          {Array.from({ length: PROGRESS_CELLS }, (_, index) => (
            <span key={index} className="boot-cell" data-on={index < filled ? "true" : "false"} />
          ))}
        </div>
        <div className="boot-foot">
          <span className="boot-state circa-mono" role="status">
            {revealed >= lines.length ? "Handing over to shell" : "Posting"}
          </span>
          <button type="button" className="boot-skip" onClick={onSkip}>
            Skip post
          </button>
        </div>
        <p className="boot-hint">Press any key to skip the post.</p>
      </div>
    </div>
  );
}

/** Subscribes to the motion preference so a mid-session change is honoured. */
function subscribeToMotion(onChange: () => void) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {};
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export function WorkstationBoot({ children }: { children: React.ReactNode }) {
  /*
   * The preference is read through `useSyncExternalStore` rather than in an
   * effect: an operator who asked for reduced motion must never be shown the
   * post screen at all, and the server snapshot keeps hydration honest.
   */
  const reduced = useSyncExternalStore(subscribeToMotion, motionReduced, () => false);
  const [revealed, setRevealed] = useState(0);
  const [handedOver, setHandedOver] = useState(false);
  const booting = !reduced && !handedOver;

  useEffect(() => {
    if (!booting) return;
    const timers = bootLines().map((_, index) =>
      window.setTimeout(() => setRevealed(index + 1), BOOT_STEP_MS * (index + 1)),
    );
    timers.push(window.setTimeout(() => setHandedOver(true), bootDurationMs()));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [booting]);

  const skip = useCallback(() => setHandedOver(true), []);

  useEffect(() => {
    if (!booting) return;
    const onKeyDown = () => skip();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [booting, skip]);

  return (
    <>
      {/*
        The shell mounts behind the post so the swap does not flash, and stays
        out of the accessibility tree and out of the tab order until it is up.
      */}
      <div className="boot-stage" aria-hidden={booting || undefined} inert={booting}>
        {children}
      </div>
      {booting && <BootScreen lines={bootLines()} revealed={revealed} onSkip={skip} />}
    </>
  );
}
