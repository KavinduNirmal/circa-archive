"use client";

import MDEditor, { type RefMDEditor } from "@uiw/react-md-editor";
import { forwardRef, useImperativeHandle, useRef } from "react";
import { useTranslations } from "next-intl";
import { ArchiveButton } from "../archive-site/archive-button";
import styles from "./editor.module.css";
import "@uiw/react-md-editor/markdown-editor.css";

type Snapshot = { text: string; start: number; end: number };
export type SourceEditorHandle = { insert: (text: string) => void };

/** Kept mounted behind tabs so the DOM selection and editing history survive preview. */
export const SourceEditor = forwardRef<
  SourceEditorHandle,
  {
    value: string;
    onChange: (value: string) => void;
  }
>(function SourceEditor({ value, onChange }, forwardedRef) {
  const t = useTranslations("editor");
  const editor = useRef<RefMDEditor>(null);
  const past = useRef<Snapshot[]>([]);
  const future = useRef<Snapshot[]>([]);
  const selection = useRef({ start: 0, end: 0 });
  const lastEdit = useRef(0);
  const textarea = () => editor.current?.textarea;
  function restore(snapshot: Snapshot) {
    onChange(snapshot.text);
    selection.current = { start: snapshot.start, end: snapshot.end };
    lastEdit.current = 0;
    requestAnimationFrame(() => {
      textarea()?.focus();
      textarea()?.setSelectionRange(snapshot.start, snapshot.end);
    });
  }
  function snapshot(): Snapshot {
    return { text: value, ...selection.current };
  }
  function change(text: string, separate = false) {
    if (text === value) return;
    if (separate || Date.now() - lastEdit.current > 800) {
      past.current.push(snapshot());
      if (past.current.length > 100) past.current.shift();
    }
    future.current = [];
    lastEdit.current = separate ? 0 : Date.now();
    onChange(text);
  }
  function undo() {
    const previous = past.current.pop();
    if (!previous) return;
    future.current.push(snapshot());
    restore(previous);
  }
  function redo() {
    const next = future.current.pop();
    if (!next) return;
    past.current.push(snapshot());
    restore(next);
  }
  function focusSelection(start: number, end = start) {
    selection.current = { start, end };
    requestAnimationFrame(() => {
      textarea()?.focus();
      textarea()?.setSelectionRange(start, end);
    });
  }
  function insert(text: string, suffix = "", placeholder = "") {
    const { start, end } = selection.current;
    const selected = value.slice(start, end) || placeholder;
    change(
      value.slice(0, start) + text + selected + suffix + value.slice(end),
      true,
    );
    const contentStart = start + text.length;
    const caret = contentStart + selected.length;
    focusSelection(start === end && placeholder ? contentStart : caret, caret);
  }
  function prefixLines(prefix: string, replaceHeading = false) {
    const { start, end } = selection.current;
    const lineStart = value.slice(0, start).lastIndexOf("\n") + 1;
    const lastPosition = end > start && value[end - 1] === "\n" ? end - 1 : end;
    const nextBreak = value.indexOf("\n", lastPosition);
    const lineEnd = nextBreak < 0 ? value.length : nextBreak;
    const lines = value.slice(lineStart, lineEnd).split("\n");
    const text = lines
      .map(
        (line) =>
          prefix +
          (replaceHeading
            ? line.replace(/^ {0,3}#{1,6}(?:[ \t]+|$)/, "")
            : line),
      )
      .join("\n");
    change(value.slice(0, lineStart) + text + value.slice(lineEnd), true);
    focusSelection(lineStart + text.length);
  }
  function codeBlock() {
    const { start, end } = selection.current;
    const before = value.slice(0, start);
    const after = value.slice(end);
    const opening = before && !before.endsWith("\n\n") ? "\n\n" : "";
    const closing = after && !after.startsWith("\n\n") ? "\n\n" : "";
    insert(`${opening}\`\`\`\n`, `\n\`\`\`${closing}`, t("placeholderCode"));
  }
  const quickActions = [
    {
      key: "italic",
      label: <em>I</em>,
      run: () => insert("*", "*", t("placeholderText")),
    },
    {
      key: "bold",
      label: <strong>B</strong>,
      run: () => insert("**", "**", t("placeholderText")),
    },
    { key: "quote", label: ">", run: () => prefixLines("> ") },
    {
      key: "inlineCode",
      label: "` `",
      run: () => insert("`", "`", t("placeholderCode")),
    },
    { key: "codeBlock", label: "```", run: codeBlock },
    {
      key: "externalReference",
      label: "[link]()",
      run: () => insert("[", "]()", t("placeholderLink")),
    },
    { key: "internalReference", label: "[[]]", run: () => insert("[[", "]]") },
    {
      key: "redact",
      label: "|| ||",
      run: () => insert("||", "||", t("placeholderRedact")),
    },
  ];
  useImperativeHandle(forwardedRef, () => ({ insert: (text) => insert(text) }));
  return (
    <div className={styles.source} data-color-mode="light">
      <div
        className={styles.syntaxTools}
        role="toolbar"
        aria-label={t("editorTab")}
      >
        <select
          className={styles.headingSelect}
          aria-label={t("heading")}
          value=""
          onChange={(event) =>
            prefixLines(`${"#".repeat(Number(event.target.value))} `, true)
          }
        >
          <option value="" disabled>
            {t("heading")}
          </option>
          {[1, 2, 3, 4, 5, 6].map((level) => (
            <option key={level} value={level}>
              H{level}
            </option>
          ))}
        </select>
        {quickActions.map(({ key, label, run }) => (
          <ArchiveButton
            key={key}
            tone="paper"
            aria-label={t(key)}
            title={t(key)}
            onClick={run}
          >
            {label}
          </ArchiveButton>
        ))}
        <span className={styles.toolSpacer} />
        <ArchiveButton tone="paper" onClick={undo}>
          {t("undo")}
        </ArchiveButton>
        <ArchiveButton tone="paper" onClick={redo}>
          {t("redo")}
        </ArchiveButton>
      </div>
      <MDEditor
        ref={editor}
        value={value}
        onChange={(text) => change(text ?? "")}
        preview="edit"
        hideToolbar
        extraCommands={[]}
        commands={[]}
        visibleDragbar={false}
        height={560}
        minHeight={400}
        autoFocus={false}
        highlightEnable
        defaultTabEnable
        textareaProps={{
          "aria-label": t("markdownLabel"),
          spellCheck: false,
          onSelect: (event) => {
            const target = event.currentTarget;
            selection.current = {
              start: target.selectionStart,
              end: target.selectionEnd,
            };
          },
          onKeyDown: (event) => {
            if (
              (event.ctrlKey || event.metaKey) &&
              ["z", "y"].includes(event.key.toLowerCase())
            ) {
              event.preventDefault();
              event.stopPropagation();
              if (event.shiftKey || event.key.toLowerCase() === "y") redo();
              else undo();
            }
          },
        }}
      />
    </div>
  );
});
