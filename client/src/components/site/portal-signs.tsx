"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { MessageBox } from "../ui/message-box";
import "./portal-signs.css";

/**
 * The four small client behaviours the public portal mounts.
 *
 * The page itself is a Server Component and its prose arrives as rendered HTML.
 * These pieces are deliberately the only JavaScript on the route: they change
 * sentences that are already there, count the visit, answer a page that is not
 * held, and refresh a register. None of them carries copy, so the `landing`
 * catalog stays on the server; every string is handed down as a prop.
 */

/** How long an altered sentence is held before the printed one returns. */
export const ALTER_HOLD_MS = 900;

/**
 * A sentence's default first cue, when the markup does not name one.
 *
 * Spread across the page so alterations never fire together: a reader who
 * notices two sentences change at the same moment is watching an effect, and a
 * reader who notices one change while reading another is not sure what they saw.
 */
const DEFAULT_ALTER_AFTER_MS = 9000;

/** The pause between one alteration and the next on the same sentence. */
const ALTER_REST_MS = 16000;

function motionReduced(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function subscribeToMotion(onChange: () => void) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {};
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * Swaps marked sentences for their other version, one at a time.
 *
 * The replacement text lives in the markup (`data-alter`) rather than in a
 * message: the alteration is a property of the sentence, and a translator who
 * cannot see both versions side by side will not write a variant that reads as
 * the same sentence remembering itself differently. Mutating `textContent`
 * rather than React state is deliberate, because this subtree is server-rendered
 * and never re-renders, so there is nothing to reconcile against.
 */
export function PortalSigns() {
  const reduced = useSyncExternalStore(subscribeToMotion, motionReduced, () => false);

  useEffect(() => {
    if (reduced) return;
    const sentences = Array.from(document.querySelectorAll<HTMLElement>("[data-alter]"));
    const timers = new Set<number>();
    /** What each sentence says when it is not altered, so a teardown can put it back. */
    const printed = new Map<HTMLElement, string>();

    const schedule = (node: HTMLElement) => {
      const original = node.textContent ?? "";
      const altered = node.dataset.alter ?? "";
      if (!altered || altered === original) return;
      printed.set(node, original);

      const after = Number(node.dataset.alterAfter) || DEFAULT_ALTER_AFTER_MS;
      const hold = Number(node.dataset.alterHold) || ALTER_HOLD_MS;

      const arm = (delay: number) => {
        const timer = window.setTimeout(() => {
          timers.delete(timer);
          node.textContent = altered;
          const back = window.setTimeout(() => {
            timers.delete(back);
            node.textContent = original;
            arm(ALTER_REST_MS);
          }, hold);
          timers.add(back);
        }, delay);
        timers.add(timer);
      };

      arm(after);
    };

    sentences.forEach(schedule);
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
      // A sentence caught mid-alteration would otherwise keep the wrong version.
      printed.forEach((text, node) => {
        node.textContent = text;
      });
    };
  }, [reduced]);

  return null;
}

/** Seconds as the registry prints a duration: two digits each, hours unbounded. */
export function attendanceText(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

/** The point at which the page stops saying "recorded" and starts saying "still". */
export const ATTENDANCE_STILL_AFTER_SECONDS = 60;

/**
 * The visit, counted.
 *
 * This is the page acknowledging that someone is reading it, which is the
 * uncanny note the brief asks for, and it is also literally true: the readout
 * counts the time this tab has been open and nothing else. There is no storage
 * and no identifier, so the acknowledgement cannot follow the reader anywhere.
 */
export function Attendance({ label, note, still, stillAfter = ATTENDANCE_STILL_AFTER_SECONDS }: {
  label: string;
  note: string;
  still: string;
  stillAfter?: number;
}) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const present = seconds >= stillAfter;
  return (
    <div className="site-attendance" role="group" aria-label={label}>
      <span className="site-attendance-value circa-mono">{attendanceText(seconds)}</span>
      <p className="site-attendance-note" data-still={present ? "true" : undefined}>
        {present ? still : note}
      </p>
    </div>
  );
}

/**
 * The register of notices, which can be refreshed into an emptier version of
 * itself.
 *
 * Pressing refresh does not fetch anything; it withdraws the notices that are
 * on screen and dates the page a day earlier, which is the joke and also the
 * only thing a page with no backend can honestly do. The list leaves the DOM
 * rather than being hidden with CSS, so nothing withdrawn stays in the
 * accessibility tree.
 */
export function RegisterRefresh({ children, updated, refreshedUpdated, refreshLabel, refreshed }: {
  children: React.ReactNode;
  updated: string;
  refreshedUpdated: string;
  refreshLabel: string;
  refreshed: string;
}) {
  const [refreshedCount, setRefreshedCount] = useState(0);
  const withdrawn = refreshedCount > 0;

  return (
    <div className="site-register" data-refreshed={withdrawn ? "true" : undefined}>
      <p className="site-register-updated circa-mono">{withdrawn ? refreshedUpdated : updated}</p>
      {!withdrawn && children}
      {withdrawn && (
        <p className="site-register-refreshed" role="status">
          {refreshed}
        </p>
      )}
      <p className="site-register-foot">
        <button type="button" className="site-refresh" onClick={() => setRefreshedCount((count) => count + 1)}>
          {refreshLabel}
        </button>
        {refreshedCount > 1 && <span className="site-refresh-count circa-mono"> ×{refreshedCount}</span>}
      </p>
    </div>
  );
}

/**
 * A link to a page the site lists but does not hold.
 *
 * It is a button, not an anchor, because nothing navigates: the registry answers
 * with a notice slip the way a counter clerk would, and the address bar stays
 * where it was. That is also why it can look like a link without lying about
 * being one.
 */
export function UnavailableLink({ label, dialogTitle, heading, body, detail }: {
  label: string;
  dialogTitle: string;
  heading: string;
  body: string;
  detail?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="site-dead-link" onClick={() => setOpen(true)}>
        {label}
      </button>
      <MessageBox
        open={open}
        title={dialogTitle}
        heading={heading}
        body={body}
        detail={detail ?? null}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
