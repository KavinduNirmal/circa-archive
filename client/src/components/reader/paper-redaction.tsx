"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";

/**
 * One redacted span, drawn on the sheet.
 *
 * The redaction is a reading affordance, not a secret: the words are in the DOM
 * so they can be revealed, and are held behind the paper colour until the
 * reader asks for them. Two things keep that honest. The mark carries an
 * accessible label, so the state is announced rather than signalled by colour
 * alone; and the text is `aria-hidden` until it is revealed, so a screen reader
 * is told there is a redaction to open instead of reading the withheld words
 * out loud.
 *
 * What this deliberately does not do is *decide* whether the text exists at
 * all. That is `RenderMode`, owned by the pipeline: in `hidden` mode the node
 * has no children and this component has nothing to reveal.
 */
export function PaperRedaction({ children }: { children?: ReactNode }) {
  const [revealed, setRevealed] = useState(false);
  const hasText = children !== undefined && children !== null && children !== false;

  function toggle() {
    if (hasText) setRevealed((current) => !current);
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    toggle();
  }

  return (
    <mark
      className="reader-redaction-inline"
      data-revealed={hasText ? String(revealed) : undefined}
      data-empty={hasText ? undefined : "true"}
      role="button"
      tabIndex={hasText ? 0 : -1}
      aria-pressed={hasText ? revealed : undefined}
      aria-label={
        hasText
          ? revealed
            ? "Redacted text, revealed. Activate to hide it again."
            : "Redacted text. Activate to reveal it."
          : "Redacted text, withheld from this copy."
      }
      onClick={toggle}
      onKeyDown={onKeyDown}
    >
      {hasText ? <span aria-hidden={revealed ? undefined : true}>{children}</span> : <span aria-hidden="true">[REDACTED]</span>}
    </mark>
  );
}
