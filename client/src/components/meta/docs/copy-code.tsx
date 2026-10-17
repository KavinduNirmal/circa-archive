"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "../../ui/button";

/**
 * A code block with a copy key.
 *
 * The block is a scrollable region, so it is focusable and reachable by arrow
 * keys as well as by drag; the copy key is a real button with a live status, not
 * an icon whose meaning is guessed. The label names the block, so a screen-reader
 * user with three examples on one page knows which one they copied.
 */
export function CopyCode({
  code,
  language,
  label,
  copyLabel,
  copiedLabel,
  failedLabel,
}: Readonly<{
  code: string;
  language?: string;
  label: string;
  copyLabel: string;
  copiedLabel: string;
  failedLabel: string;
}>) {
  const [state, setState] = React.useState<"idle" | "copied" | "failed">("idle");

  React.useEffect(() => {
    if (state === "idle") return;
    const timer = window.setTimeout(() => setState("idle"), 2200);
    return () => window.clearTimeout(timer);
  }, [state]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setState("copied");
    } catch {
      setState("failed");
    }
  }

  const status = state === "copied" ? copiedLabel : state === "failed" ? failedLabel : copyLabel;

  return (
    <figure className="meta-code">
      <div className="meta-code-bar">
        <span className="meta-code-label">
          <span aria-hidden="true">$</span>
          {label}
        </span>
        <span className="meta-code-lang">{language}</span>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          className="meta-code-copy"
          onClick={copy}
          aria-label={`${copyLabel} — ${label}`}
        >
          {state === "copied" ? <Check aria-hidden="true" size={12} /> : <Copy aria-hidden="true" size={12} />}
          <span aria-live="polite">{status}</span>
        </Button>
      </div>
      <pre className="meta-code-pre" tabIndex={0} aria-label={label}>
        <code>{code}</code>
      </pre>
    </figure>
  );
}
