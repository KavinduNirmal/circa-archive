"use client";

import { useState, useEffect } from "react";
import {
  ArrowUpRight,
  Check,
  Copy,
  GitBranch,
  MessageSquare,
} from "lucide-react";
import { Button } from "../../ui/button";

export function DocsActions({
  markdown,
  sourceUrl,
  editUrl,
  labels,
}: Readonly<{
  markdown: string;
  sourceUrl: string;
  editUrl?: string;
  labels: {
    edit: string;
    copy: string;
    copied: string;
    failed: string;
    chat: string;
    chatHelp: string;
    context: string;
    paste: string;
  };
}>) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed" | "paste">(
    "idle",
  );
  useEffect(() => {
    if (status === "idle" || status === "paste") return;
    const timer = setTimeout(() => setStatus("idle"), 2200);
    return () => clearTimeout(timer);
  }, [status]);

  async function copy(context = false) {
    try {
      await navigator.clipboard.writeText(
        context ? `${labels.context}\n\n${sourceUrl}\n\n${markdown}` : markdown,
      );
      setStatus(context ? "paste" : "copied");
    } catch {
      setStatus("failed");
    }
  }

  const effectiveEditUrl = editUrl ?? sourceUrl.replace(/\/blob\//, "/edit/");

  return (
    <div className="meta-doc-actions">
      <div className="meta-doc-action-buttons">
        <Button variant="outline" size="sm" onClick={() => copy()}>
          {status === "copied" ? (
            <Check aria-hidden="true" size={14} />
          ) : (
            <Copy aria-hidden="true" size={14} />
          )}
          {labels.copy}
        </Button>
        <a
          className="meta-doc-edit"
          href={effectiveEditUrl}
          target="_blank"
          rel="noreferrer"
          title={labels.edit}
        >
          <GitBranch size={14} aria-hidden="true" />
          {labels.edit}
          <ArrowUpRight size={12} aria-hidden="true" />
        </a>
        <a
          className="meta-doc-chat"
          href="https://chatgpt.com/"
          target="_blank"
          rel="noreferrer"
          onClick={() => {
            void copy(true);
          }}
          title={labels.chatHelp}
        >
          <MessageSquare size={14} aria-hidden="true" />
          {labels.chat}
          <ArrowUpRight size={12} aria-hidden="true" />
        </a>
      </div>
      <span className="meta-doc-action-status" role="status">
        {status === "idle" ? "" : labels[status]}
      </span>
    </div>
  );
}
