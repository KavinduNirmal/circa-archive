"use client";

import { AlertDialog } from "radix-ui";
import { AlertTriangle, Info } from "lucide-react";
import "./message-box.css";

export type MessageBoxProps = {
  open: boolean;
  /** Titlebar text: the application that is speaking. */
  title: string;
  heading: string;
  body: string;
  /** The policy or error reference printed under the body. */
  reference?: string | null;
  /** A value quoted back to the operator, such as a refused address. */
  detail?: string | null;
  tone?: "warning" | "info";
  onClose: () => void;
};

/**
 * The in-world message box shared by the applications.
 *
 * `AlertDialog` is deliberate: these notices have one acknowledgement and no
 * dismissal by outside click, which is how the browser-era modal behaved. The
 * caller supplies the copy, so each application keeps its own voice while the
 * chrome, the focus trap, and the single OK stay identical.
 */
export function MessageBox({
  open,
  title,
  heading,
  body,
  reference,
  detail,
  tone = "warning",
  onClose,
}: MessageBoxProps) {
  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="message-box-backdrop" />
        <AlertDialog.Content className="message-box circa-raised">
          <div className="message-box-titlebar">
            <AlertDialog.Title className="message-box-title">
              {title}
            </AlertDialog.Title>
          </div>
          <div className="message-box-body">
            <span className="message-box-glyph" aria-hidden="true">
              {tone === "info" ? (
                <Info className="message-box-icon" />
              ) : (
                <AlertTriangle className="message-box-icon" />
              )}
            </span>
            <AlertDialog.Description className="message-box-text">
              <span className="message-box-heading">{heading}</span>
              {body}
            </AlertDialog.Description>
          </div>
          {detail && <p className="message-box-detail circa-mono">{detail}</p>}
          {reference && (
            <p className="message-box-reference circa-mono">{reference}</p>
          )}
          <div className="message-box-actions">
            <AlertDialog.Action className="message-box-ok">
              OK
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
