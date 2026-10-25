import * as React from "react";
import { Tooltip as Primitive } from "radix-ui";

function CopyIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="13"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      width="13"
    >
      <rect height="14" rx="2" width="14" x="8" y="8" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

interface Props {
  source: string;
  label: string;
  copiedLabel: string;
  failedLabel: string;
}

type CopyState = "idle" | "copied" | "failed";

export default function CopyMarkdown({
  source,
  label,
  copiedLabel,
  failedLabel,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [state, setState] = React.useState<CopyState>("idle");
  const timer = React.useRef<number | undefined>(undefined);

  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  async function handleCopy() {
    try {
      const response = await fetch(source);
      if (!response.ok) throw new Error("Source unavailable");
      await navigator.clipboard.writeText(await response.text());
      setState("copied");
    } catch {
      setState("failed");
    }
    setOpen(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setOpen(false);
      setState("idle");
    }, 2200);
  }

  const message =
    state === "copied" ? copiedLabel : state === "failed" ? failedLabel : label;

  return (
    <Primitive.Provider delayDuration={150}>
      <Primitive.Root open={open} onOpenChange={setOpen}>
        <Primitive.Trigger asChild>
          <button
            type="button"
            data-copy-markdown
            onClick={handleCopy}
            aria-label={label}
          >
            {label}
            <CopyIcon />
          </button>
        </Primitive.Trigger>
        <Primitive.Portal>
          <Primitive.Content
            data-slot="tooltip-content"
            sideOffset={8}
            collisionPadding={12}
          >
            {message}
            <Primitive.Arrow data-slot="tooltip-arrow" />
          </Primitive.Content>
        </Primitive.Portal>
      </Primitive.Root>
    </Primitive.Provider>
  );
}
