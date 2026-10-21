"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { useTranslations } from "next-intl";
import { type MarkdownToolId } from "./document-model";
import { WORD_NAME, WORD_WINDOW_TITLE } from "./word-identity";
import {
  TOOL_CHANGE_KEYS,
  WordMenu,
  WordRuler,
  WordStatus,
  WordToolbar,
  type WordActions,
} from "./word-chrome";
import { WordNotice, type WordNoticeKind } from "./word-notice";
import {
  cursorPosition,
  editorReducer,
  editorStats,
  initialState,
} from "./editor-state";
import "./word.css";

/** The body a new document starts with, so the tools have something to act on. */
const STARTER = [
  "# The Black Dog",
  "",
  "Filed from the north terminal. The animal was reported at the freight yard",
  "on three separate nights, and each report places it *inside* a locked car.",
  "",
  "## What was checked",
  "",
  "- The waybill, twice, against the yard copy",
  "- The seal book for the same week",
  "- The gauge readings from the north station",
].join("\n");

/** The one place the editor reads a selection out of or writes one into the DOM. */
function readSelection(element: HTMLTextAreaElement): {
  start: number;
  end: number;
} {
  return { start: element.selectionStart, end: element.selectionEnd };
}

/**
 * The record editor, opened by the CIRCA Word shortcut.
 *
 * A word processor around a plain text area: the document is the string, the
 * chrome is a format bar of the markdown tools, and each tool is a pure edit
 * from `document-model.ts`. Nothing here renders Markdown, because the record's
 * `.pdf` is the reader's job and a second renderer would be a second thing to
 * keep in step with the first.
 */
export function WordWindow({
  onCloseWindow,
  initialBody = STARTER,
}: {
  onCloseWindow: () => void;
  /** The document to open with. Tests use a short one, and a new file starts empty. */
  initialBody?: string;
}) {
  const [state, dispatch] = useReducer(
    editorReducer,
    initialBody,
    initialState,
  );
  const [notice, setNotice] = useState<WordNoticeKind | null>(null);
  const t = useTranslations("word");
  const area = useRef<HTMLTextAreaElement | null>(null);
  const address = useRef<HTMLInputElement | null>(null);

  /*
   * Text types itself as it grows, the way the page did: the sheet gets taller
   * with the document instead of scrolling inside a fixed frame, so the whole
   * thing reads as one page. The measurement is the box the caret needs, so it
   * does not depend on the font metrics the window happens to land on.
   */
  useLayoutEffect(() => {
    const element = area.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  }, [state.present, state.size, state.ruler]);

  /*
   * Focus and selection are separate effects because they are separate promises:
   * focus survives a tool press, while the selection has to be written back
   * after the document changes, or the caret jumps to the end of the text.
   */
  useEffect(() => {
    const element = area.current;
    if (!element || !state.focused || state.address) return;
    element.focus({ preventScroll: true });
    element.setSelectionRange(state.selection.start, state.selection.end);
  }, [state.selection, state.focused, state.address, state.present]);

  // The address strip takes the keyboard while it is open, and gives it back.
  useEffect(() => {
    if (state.address) address.current?.focus();
  }, [state.address]);

  const applyTool = useCallback((tool: MarkdownToolId, value?: string) => {
    dispatch({ type: "tool", tool, address: value });
  }, []);

  function runTool(tool: MarkdownToolId) {
    // The button took the focus, so the caret in the area is stale-looking but
    // still correct; the effect above puts both back.
    applyTool(tool);
    dispatch({ type: "report", message: { key: TOOL_CHANGE_KEYS[tool] } });
    dispatch({ type: "focus", focused: true });
  }

  function askAddress(tool: "link" | "image") {
    dispatch({ type: "address", tool });
    dispatch({ type: "quiet" });
  }

  function insertAddress() {
    const pending = state.address;
    if (!pending) return;
    applyTool(pending.tool, pending.value.trim());
    dispatch({
      type: "report",
      message: { key: TOOL_CHANGE_KEYS[pending.tool] },
    });
    dispatch({ type: "focus", focused: true });
  }

  /** The style box writes the same heading edit the H1 to H3 tools write. */
  function applyStyle(style: "body" | "h1" | "h2" | "h3") {
    runTool(
      style === "body"
        ? "clear"
        : style === "h1"
          ? "heading1"
          : style === "h2"
            ? "heading2"
            : "heading3",
    );
  }

  /** The action set both bars share. The menu and the toolbar own the same editor. */
  const actions: WordActions = {
    tool: runTool,
    askAddress,
    undo: () => dispatch({ type: "undo" }),
    redo: () => dispatch({ type: "redo" }),
    newDocument: () => dispatch({ type: "new" }),
    save: () => setNotice("save"),
    about: () => setNotice("about"),
    policy: () => setNotice("policy"),
    close: onCloseWindow,
    setSize: (size) => dispatch({ type: "size", size }),
    toggleRuler: () => dispatch({ type: "ruler", ruler: !state.ruler }),
    quiet: () => dispatch({ type: "quiet" }),
    setStyle: applyStyle,
  };

  /*
   * A tool press has to say what it did, so it reports through the status bar's
   * notice line. The next edit or caret move clears it, which is what keeps the
   * line from going stale.
   */
  useEffect(() => {
    if (!state.notice) return;
    const timer = window.setTimeout(() => dispatch({ type: "quiet" }), 4000);
    return () => window.clearTimeout(timer);
  }, [state.notice]);

  const stats = editorStats(state);
  const caret = cursorPosition(state.present, state.selection);
  // The counts cell is interface chrome, so the plural forms come from the
  // catalog rather than from the model's English-only formatter.
  const counts = t("statusCounts", {
    words: stats.words,
    lines: stats.lines,
    characters: stats.characters,
  });
  const summary = `${counts} | ${t("statusCaret", { line: caret.line, column: caret.column })}`;
  const tool = state.active[0];

  /** The editing keys the text area would otherwise swallow, plus the file keys. */
  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!(event.ctrlKey || event.metaKey)) {
      if (state.notice) dispatch({ type: "quiet" });
      return;
    }
    const key = event.key.toLowerCase();
    if (key === "z" && !event.shiftKey) {
      event.preventDefault();
      dispatch({ type: "undo" });
      return;
    }
    if (key === "y" || (key === "z" && event.shiftKey)) {
      event.preventDefault();
      dispatch({ type: "redo" });
      return;
    }
    if (key === "b") {
      event.preventDefault();
      runTool("bold");
      return;
    }
    if (key === "i") {
      event.preventDefault();
      runTool("italic");
      return;
    }
    if (key === "s" || key === "p") {
      // Save and Print both end in a stated reason rather than a silent no-op.
      event.preventDefault();
      dispatch({ type: "quiet" });
      setNotice("save");
      return;
    }
    if (key === "n") {
      event.preventDefault();
      dispatch({ type: "new" });
    }
  }

  return (
    <div
      className="word"
      data-size={state.size}
      data-ruler={state.ruler ? "true" : "false"}
    >
      <WordMenu state={state} actions={actions} />
      <WordToolbar state={state} actions={actions} />
      {state.address && (
        <form
          className="word-addressbar"
          aria-label={
            state.address.tool === "link"
              ? t("addressFormLink")
              : t("addressFormImage")
          }
          onSubmit={(event) => {
            event.preventDefault();
            insertAddress();
          }}
        >
          <label className="word-addresslabel" htmlFor="word-address">
            {state.address.tool === "link"
              ? t("addressLinkTo")
              : t("addressImageAt")}
          </label>
          <input
            id="word-address"
            ref={address}
            className="word-addressinput circa-mono"
            type="text"
            spellCheck={false}
            autoComplete="off"
            value={state.address.value}
            placeholder={t("addressPlaceholder")}
            onChange={(event) =>
              dispatch({ type: "addressValue", value: event.target.value })
            }
          />
          <button type="submit" className="word-addressbutton">
            {t("addressInsert")}
          </button>
          <button
            type="button"
            className="word-addressbutton"
            onClick={() => dispatch({ type: "address", tool: null })}
          >
            {t("addressCancel")}
          </button>
        </form>
      )}
      {state.ruler && <WordRuler />}
      <div className="word-desk">
        <div className="word-page">
          <label className="sr-only" htmlFor="word-document">
            {t("documentLabel")}
          </label>
          <textarea
            key={state.revision}
            id="word-document"
            ref={area}
            className="word-document circa-mono"
            value={state.present}
            spellCheck={false}
            aria-describedby="word-document-note"
            onFocus={() => dispatch({ type: "focus", focused: true })}
            onBlur={() => dispatch({ type: "focus", focused: false })}
            onClick={(event) =>
              dispatch({
                type: "selection",
                selection: readSelection(event.currentTarget),
              })
            }
            onKeyUp={(event) =>
              dispatch({
                type: "selection",
                selection: readSelection(event.currentTarget),
              })
            }
            onSelect={(event) =>
              dispatch({
                type: "selection",
                selection: readSelection(event.currentTarget),
              })
            }
            onChange={(event) =>
              dispatch({
                type: "change",
                text: event.target.value,
                selection: readSelection(event.currentTarget),
              })
            }
            onKeyDown={onKeyDown}
          />
          <span className="sr-only" id="word-document-note">
            {t("documentNote")}
          </span>
          <span className="word-page-stamp" aria-hidden="true">
            {t("draftStamp")}
          </span>
        </div>
      </div>
      <WordStatus
        state={state}
        summary={tool ? `${summary} | ${state.active.join(", ")}` : summary}
      />
      <WordNotice kind={notice} onClose={() => setNotice(null)} />
      <span className="sr-only">
        {t("windowLabel", { name: WORD_NAME, title: WORD_WINDOW_TITLE })}
      </span>
    </div>
  );
}
