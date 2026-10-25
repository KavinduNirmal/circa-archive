"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ArchiveButton } from "./archive-button";
import styles from "./archive-site.module.css";

export type ArchiveNavItem = {
  label: string;
  href: string;
  external?: boolean;
};

export function ArchiveNavDropdown({
  label,
  href,
  current,
  items,
}: {
  label: string;
  href: string;
  current?: boolean;
  items: readonly ArchiveNavItem[];
}) {
  const [open, setOpen] = useState(false);
  const pinned = useRef(false);
  const root = useRef<HTMLDivElement>(null);
  const id = useId();
  const close = () => {
    pinned.current = false;
    setOpen(false);
  };

  useEffect(() => {
    const dismiss = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) {
        pinned.current = false;
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, []);

  return (
    <div
      ref={root}
      className={styles.navDropdown}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => {
        if (!root.current?.contains(document.activeElement)) close();
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) close();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          close();
          root.current?.querySelector("button")?.focus();
          event.stopPropagation();
        }
      }}
    >
      <ArchiveButton href={href} current={current}>
        {label}
      </ArchiveButton>
      <ArchiveButton
        className={styles.navToggle}
        aria-label={label}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          pinned.current = !pinned.current;
          setOpen(pinned.current);
        }}
      >
        <ChevronDown size={12} aria-hidden="true" />
      </ArchiveButton>
      <ul id={id} className={styles.navDropdownPanel} hidden={!open}>
        {items.map((item) => (
          <li key={item.label}>
            {item.external ? (
              <a
                href={item.href}
                target="_blank"
                rel="noreferrer"
                onClick={close}
              >
                {item.label}
              </a>
            ) : (
              <Link href={item.href} onClick={close}>
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
