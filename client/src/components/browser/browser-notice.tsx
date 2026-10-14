"use client";

import { MessageBox } from "../ui/message-box";
import { BROWSER_NAME } from "./browser-identity";

/**
 * The browser's refusals and About box.
 *
 * Every notice names the policy that produced it, so a restriction reads as the
 * archive's rule rather than as a missing feature. The box itself is the shared
 * in-world message box; only the copy belongs here.
 */
export type BrowserNoticeKind = "tab" | "navigation" | "policy" | "about";

type NoticeCopy = { title: string; heading: string; body: string; reference: string };

const COPY: Record<BrowserNoticeKind, NoticeCopy> = {
  tab: {
    title: BROWSER_NAME,
    heading: "A new tab cannot be opened",
    body: "Additional browser contexts are not permitted on the local network. The CIRCA Internal Archive tab is the only context this terminal is cleared for, and it stays open.",
    reference: "LN-POLICY-07 / ERR_LOCAL_NETWORK_TAB",
  },
  navigation: {
    title: BROWSER_NAME,
    heading: "Cannot open the page",
    body: "The address is assigned by the local network, so this browser cannot open any other host from this terminal. Only the internal archive index is reachable.",
    reference: "LN-POLICY-04 / ERR_LOCAL_NETWORK_HOST",
  },
  policy: {
    title: BROWSER_NAME,
    heading: "Local network policy",
    body: "This terminal is bound to the CIRCA internal archive. New tabs, bookmarking, and external hosts are disabled on this connection so the index cannot be used as a way out.",
    reference: "LN-POLICY-07",
  },
  about: {
    title: `About ${BROWSER_NAME}`,
    heading: `${BROWSER_NAME} 4.12`,
    body: "Internal use only. Do not use on public networks. This build is bound to the archive index; additional contexts, bookmarks, and external hosts are disabled by local network policy.",
    reference: "Build 1999.4 / CIRCA-OS",
  },
};

export function BrowserNotice({ kind, attempted, onClose }: {
  kind: BrowserNoticeKind | null;
  /** The address a refused navigation was aimed at, quoted back in the notice. */
  attempted?: string;
  onClose: () => void;
}) {
  const copy = kind ? COPY[kind] : null;
  return (
    <MessageBox
      open={kind !== null}
      title={copy?.title ?? ""}
      heading={copy?.heading ?? ""}
      body={copy?.body ?? ""}
      reference={copy?.reference}
      detail={kind === "navigation" ? attempted ?? null : null}
      tone={kind === "about" ? "info" : "warning"}
      onClose={onClose}
    />
  );
}
