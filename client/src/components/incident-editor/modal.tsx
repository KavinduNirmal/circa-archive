"use client";
import { Dialog } from "radix-ui";
import { useRef, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ArchiveButton } from "../archive-site/archive-button";
import styles from "./editor.module.css";

export function EditorModal({
  title,
  children,
  open,
  onClose,
  drawer = false,
}: {
  title: string;
  children: ReactNode;
  open: boolean;
  onClose: () => void;
  drawer?: boolean;
}) {
  const t = useTranslations("editor");
  const returnFocus = useRef<HTMLElement | null>(null);
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content
          aria-describedby={undefined}
          className={`${styles.modal} ${drawer ? styles.drawer : ""}`}
          onOpenAutoFocus={() => {
            returnFocus.current = document.activeElement as HTMLElement;
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            returnFocus.current?.focus();
          }}
        >
          <div className={styles.modalHead}>
            <Dialog.Title>{title}</Dialog.Title>
            <Dialog.Close asChild>
              <ArchiveButton tone="paper">{t("close")}</ArchiveButton>
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
