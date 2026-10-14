"use client";

import { useState } from "react";

type CopyState = "idle" | "copied" | "blocked";

/**
 * Copy-to-clipboard for a command or a document path.
 *
 * A failed copy is reported rather than swallowed: the clipboard API is
 * unavailable over plain HTTP and in some locked-down browsers, and a control
 * that silently does nothing is worse than one that admits it could not help.
 */
export function CopyCommand({ text, label }: { text: string; label?: string }) {
  const [state, setState] = useState<CopyState>("idle");

  async function copy() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("blocked");
    }
  }

  return (
    <span className="landing-copy">
      <button
        type="button"
        className="landing-copy-button"
        data-state={state}
        aria-label={label ?? `Copy ${text}`}
        onClick={() => {
          void copy();
        }}
      >
        Copy
      </button>
      <span className="landing-copy-state circa-label" role="status">
        {state === "copied" ? "Copied" : state === "blocked" ? "Copy blocked" : ""}
      </span>
    </span>
  );
}
