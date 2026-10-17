"use client";

import { Menubar } from "radix-ui";
import { useTranslations } from "next-intl";
import { WORD_NAME, TEXT_SIZE_LABELS, type TextSize } from "./word-identity";
import { MARKDOWN_TOOLS, findTool, type MarkdownTool, type MarkdownToolId } from "./document-model";
import { canRedo, canUndo, type EditorState } from "./editor-state";
import "../ui/menubar.css";

/** Every action the editor's chrome can take. */
export type WordActions = {
  tool: (tool: MarkdownToolId) => void;
  askAddress: (tool: "link" | "image") => void;
  undo: () => void;
  redo: () => void;
  newDocument: () => void;
  save: () => void;
  about: () => void;
  policy: () => void;
  close: () => void;
  setSize: (size: TextSize) => void;
  setStyle: (style: "body" | "h1" | "h2" | "h3") => void;
  toggleRuler: () => void;
  quiet: () => void;
};

const TEXT_SIZES: readonly TextSize[] = ["small", "normal", "large"];

/**
 * Where each tool's accessible name comes from.
 *
 * `document-model.ts` carries the tool table and the markdown each tool writes,
 * not the editor's interface copy: the plain-language name is a label the chrome
 * puts on a control, so the names live in the `word` catalog and this record only
 * maps a tool to its key. A record rather than a key built from the id, because
 * the catalog is flat and camelCase.
 */
export const TOOL_NAME_KEYS: Record<MarkdownToolId, string> = {
  bold: "toolBold",
  italic: "toolItalic",
  strike: "toolStrike",
  code: "toolCode",
  heading1: "toolHeading1",
  heading2: "toolHeading2",
  heading3: "toolHeading3",
  bullets: "toolBullets",
  numbers: "toolNumbers",
  quote: "toolQuote",
  codeblock: "toolCodeblock",
  link: "toolLink",
  image: "toolImage",
  table: "toolTable",
  rule: "toolRule",
  clear: "toolClear",
};

/**
 * Where each tool's status-bar report comes from.
 *
 * The report the editor shows after a tool runs is a notice, so it is catalog
 * copy for the same reason the tool names are; the change table in the model
 * stays the model's own, and the chrome reads the key it needs.
 */
export const TOOL_CHANGE_KEYS: Record<MarkdownToolId, string> = {
  bold: "changeBold",
  italic: "changeItalic",
  strike: "changeStrike",
  code: "changeCode",
  heading1: "changeHeading1",
  heading2: "changeHeading2",
  heading3: "changeHeading3",
  bullets: "changeBullets",
  numbers: "changeNumbers",
  quote: "changeQuote",
  codeblock: "changeCodeblock",
  link: "changeLink",
  image: "changeImage",
  table: "changeTable",
  rule: "changeRule",
  clear: "changeClear",
};

function toolGroup(group: MarkdownTool["group"]): MarkdownTool[] {
  return MARKDOWN_TOOLS.filter((tool) => tool.group === group);
}

/**
 * The menu bar, with the File menu the classic word processor had.
 *
 * File, Edit, View, and Insert are real menus rather than decoration, and the
 * items that cannot act say why on the item itself: printing needs a printer,
 * opening another document is not something a workstation draft has a route to,
 * and saving is refused by the filing key. Nothing here is a dead control.
 */
export function WordMenu({ state, actions }: { state: EditorState; actions: WordActions }) {
  const t = useTranslations("word");
  return (
    <Menubar.Root className="circa-menubar" aria-label={t("menubarLabel", { name: WORD_NAME })}>
      <Menubar.Menu>
        <Menubar.Trigger className="circa-menutitle" onClick={actions.quiet}>{t("menuFile")}</Menubar.Trigger>
        <Menubar.Portal>
          <Menubar.Content className="circa-menu" align="start" sideOffset={0}>
            <Menubar.Item className="circa-menuitem" onSelect={actions.newDocument}>
              {t("fileNew")}<span className="circa-menukey">Ctrl+N</span>
            </Menubar.Item>
            <Menubar.Item className="circa-menuitem" disabled title={t("fileOpenTitle")}>
              {t("fileOpen")}
            </Menubar.Item>
            <Menubar.Item className="circa-menuitem" disabled title={t("fileSaveTitle")}>
              {t("fileSave")}<span className="circa-menukey">Ctrl+S</span>
            </Menubar.Item>
            <Menubar.Item className="circa-menuitem" data-restricted="true" onSelect={actions.save}>
              {t("fileToCase")}<span className="circa-menurestricted">{t("fileToCaseNoKey")}</span>
            </Menubar.Item>
            <Menubar.Separator className="circa-menuseparator" />
            <Menubar.Item className="circa-menuitem" disabled title={t("filePrintTitle")}>
              {t("filePrint")}<span className="circa-menukey">Ctrl+P</span>
            </Menubar.Item>
            <Menubar.Separator className="circa-menuseparator" />
            <Menubar.Item className="circa-menuitem" onSelect={actions.close}>{t("fileCloseWindow")}</Menubar.Item>
          </Menubar.Content>
        </Menubar.Portal>
      </Menubar.Menu>

      <Menubar.Menu>
        <Menubar.Trigger className="circa-menutitle" onClick={actions.quiet}>{t("menuEdit")}</Menubar.Trigger>
        <Menubar.Portal>
          <Menubar.Content className="circa-menu" align="start" sideOffset={0}>
            <Menubar.Item className="circa-menuitem" disabled={!canUndo(state)} onSelect={actions.undo}>
              {t("undoLabel")}<span className="circa-menukey">Ctrl+Z</span>
            </Menubar.Item>
            <Menubar.Item className="circa-menuitem" disabled={!canRedo(state)} onSelect={actions.redo}>
              {t("redoLabel")}<span className="circa-menukey">Ctrl+Y</span>
            </Menubar.Item>
            <Menubar.Separator className="circa-menuseparator" />
            {/* The editor keeps its own undo stack, so the browser's menu items
                would cut across it; the keys and these two items are the route. */}
            <Menubar.Item className="circa-menuitem" disabled title={t("editCutCopyPasteTitle")}>
              {t("editCutCopyPaste")}
            </Menubar.Item>
            <Menubar.Separator className="circa-menuseparator" />
            <Menubar.Item className="circa-menuitem" onSelect={() => actions.tool("clear")}>
              {t(TOOL_NAME_KEYS.clear)}
            </Menubar.Item>
          </Menubar.Content>
        </Menubar.Portal>
      </Menubar.Menu>

      <Menubar.Menu>
        <Menubar.Trigger className="circa-menutitle" onClick={actions.quiet}>{t("menuView")}</Menubar.Trigger>
        <Menubar.Portal>
          <Menubar.Content className="circa-menu" align="start" sideOffset={0}>
            <Menubar.CheckboxItem className="circa-menuitem" checked={state.ruler} onCheckedChange={actions.toggleRuler}>
              {t("viewRuler")}
            </Menubar.CheckboxItem>
            <Menubar.Separator className="circa-menuseparator" />
            <Menubar.Label className="circa-menulabel">{t("viewTextSize")}</Menubar.Label>
            <Menubar.RadioGroup value={state.size} onValueChange={(value) => actions.setSize(value as TextSize)}>
              {TEXT_SIZES.map((size) => (
                <Menubar.RadioItem key={size} className="circa-menuitem" value={size}>{t(TEXT_SIZE_LABELS[size])}</Menubar.RadioItem>
              ))}
            </Menubar.RadioGroup>
          </Menubar.Content>
        </Menubar.Portal>
      </Menubar.Menu>

      <Menubar.Menu>
        <Menubar.Trigger className="circa-menutitle" onClick={actions.quiet}>{t("menuInsert")}</Menubar.Trigger>
        <Menubar.Portal>
          <Menubar.Content className="circa-menu" align="start" sideOffset={0}>
            {(["link", "image", "table", "rule", "codeblock"] as const).map((id) => {
              const tool = findTool(id);
              if (!tool) return null;
              return (
                <Menubar.Item key={id} className="circa-menuitem"
                  onSelect={() => (id === "link" || id === "image" ? actions.askAddress(id) : actions.tool(id))}>
                  {t(TOOL_NAME_KEYS[tool.id])}<span className="circa-menukey">{tool.syntax}</span>
                </Menubar.Item>
              );
            })}
          </Menubar.Content>
        </Menubar.Portal>
      </Menubar.Menu>

      <Menubar.Menu>
        <Menubar.Trigger className="circa-menutitle" onClick={actions.quiet}>{t("menuHelp")}</Menubar.Trigger>
        <Menubar.Portal>
          <Menubar.Content className="circa-menu" align="start" sideOffset={0}>
            <Menubar.Item className="circa-menuitem" onSelect={actions.policy}>{t("filingPolicy")}</Menubar.Item>
            <Menubar.Separator className="circa-menuseparator" />
            <Menubar.Item className="circa-menuitem" onSelect={actions.about}>{t("aboutLabel", { name: WORD_NAME })}</Menubar.Item>
          </Menubar.Content>
        </Menubar.Portal>
      </Menubar.Menu>
    </Menubar.Root>
  );
}

/**
 * The format bar: the markdown tools, and nothing that is not one of them.
 *
 * The buttons carry the markdown they write rather than a picture of the result.
 * `B` and `I` keep the word processor's own marks, because those two are the same
 * in both languages; everything else prints its syntax, so the bar documents the
 * format while it applies it. Each tool has a fixed width, so a wide label like
 * `{ }` cannot stagger the row.
 */
export function WordToolbar({ state, actions }: { state: EditorState; actions: WordActions }) {
  const t = useTranslations("word");
  const active = new Set(state.active);
  return (
    <div className="word-formatbar" role="toolbar" aria-label={t("toolbarLabel")}>
      {/*
        The style box is a real control rather than a readout: choosing a level
        is the same edit the heading tools make, which is what the box was for in
        the first place. It reads the caret's line and writes it back.
      */}
      <div className="word-formatgroup">
        <label className="word-stylelabel" htmlFor="word-style">{t("styleLabel")}</label>
        <select id="word-style" className="word-style" value={styleValue(state)} onChange={(event) => actions.setStyle(event.target.value as "body" | "h1" | "h2" | "h3")}>
          <option value="body">{t("styleBody")}</option>
          <option value="h1">{t(TOOL_NAME_KEYS.heading1)}</option>
          <option value="h2">{t(TOOL_NAME_KEYS.heading2)}</option>
          <option value="h3">{t(TOOL_NAME_KEYS.heading3)}</option>
        </select>
      </div>
      <span className="word-formatdivider" aria-hidden="true" />
      <div className="word-formatgroup" role="group" aria-label={t("groupText")}>
        <span className="word-formatlegend">{t("groupText")}</span>
        {[...toolGroup("text")].map((tool) => (
          <WordToolButton key={tool.id} tool={tool} pressed={active.has(tool.id)} onClick={() => actions.tool(tool.id)} />
        ))}
      </div>
      <span className="word-formatdivider" aria-hidden="true" />
      <div className="word-formatgroup" role="group" aria-label={t("groupBlocks")}>
        <span className="word-formatlegend">{t("groupBlocks")}</span>
        {[...toolGroup("blocks")].map((tool) => (
          <WordToolButton key={tool.id} tool={tool} pressed={active.has(tool.id)}
            onClick={() => (tool.id === "link" || tool.id === "image" ? actions.askAddress(tool.id) : actions.tool(tool.id))} />
        ))}
      </div>
      <div className="word-formatgroup">
        <button type="button" className="word-tool word-tool-wide" aria-label={t("undoLabel")} title={t("undoTitle")}
          disabled={!canUndo(state)} onClick={actions.undo}>
          <span className="word-toollabel">{t("undoLabel")}</span>
        </button>
        <button type="button" className="word-tool word-tool-wide" aria-label={t("redoLabel")} title={t("redoTitle")}
          disabled={!canRedo(state)} onClick={actions.redo}>
          <span className="word-toollabel">{t("redoLabel")}</span>
        </button>
      </div>
    </div>
  );
}

/** The style box's current value, read from the tools the caret is inside. */
function styleValue(state: EditorState): "body" | "h1" | "h2" | "h3" {
  if (state.active.includes("heading1")) return "h1";
  if (state.active.includes("heading2")) return "h2";
  if (state.active.includes("heading3")) return "h3";
  return "body";
}

/** One markdown tool. The tooltip is the markdown it writes, so nothing is a guess. */
function WordToolButton({ tool, pressed, onClick }: { tool: MarkdownTool; pressed: boolean; onClick: () => void }) {
  const t = useTranslations("word");
  const name = t(TOOL_NAME_KEYS[tool.id]);
  return (
    <button type="button" className="word-tool" data-tool={tool.id} aria-label={name}
      aria-pressed={pressed ? "true" : undefined} title={`${name}  ${tool.syntax}`} onClick={onClick}>
      <span className="word-toollabel" aria-hidden="true">{tool.label}</span>
    </button>
  );
}

/**
 * The ruler above the page.
 *
 * It is drawn, not measured: the margins and the inch scale are gradients on one
 * element, because the sheet's padding is fixed and a ruler that pretended to
 * track a draggable margin would be a lie with a handle on it.
 */
export function WordRuler() {
  return <div className="word-ruler" aria-hidden="true" />;
}

/**
 * The status bar. Page, cursor position, counts, and the text size, which is the
 * set of cells the word processor's status bar carried.
 *
 * There is only ever one page, because the document is a Markdown draft rather
 * than laid-out paper: the page cell says `Page 1` and the counts cell carries
 * the counts, then the size cell, then the filing state.
 */
export function WordStatus({ state, summary }: { state: EditorState; summary: string }) {
  const t = useTranslations("word");
  return (
    <div className="word-statusbar">
      <span className="word-status-report" role="status">{state.notice
        ? t(state.notice.key, state.notice.size ? { size: t(TEXT_SIZE_LABELS[state.notice.size]) } : undefined)
        : summary}</span>
      <span className="word-status-cell">{t("statusPage")}</span>
      <span className="word-status-cell">{t("styleBody")}</span>
      <span className="word-status-cell">{t(TEXT_SIZE_LABELS[state.size])}</span>
      <span className="word-status-cell">{t("statusUnfiled")}</span>
    </div>
  );
}
