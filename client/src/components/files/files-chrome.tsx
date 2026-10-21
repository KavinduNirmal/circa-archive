"use client";

import {
  ArrowLeft,
  ArrowRight,
  ChevronUp,
  ClipboardCopy,
  ClipboardPaste,
  FileQuestion,
  FolderCog,
  Info,
  RotateCw,
  Scissors,
  Trash2,
  Undo2,
  List,
  LayoutGrid,
  Table2,
} from "lucide-react";
import { Menubar } from "radix-ui";
import { useTranslations } from "next-intl";
import { EXPLORER_NAME } from "./files-identity";
import { SORT_LABEL_KEYS } from "./file-list";
import {
  SORT_KEYS,
  type FileSortKey,
  type FileView,
  type SortDirection,
} from "./files-index";
import "../ui/menubar.css";

/** Every chrome action the explorer owns, handed to the menu and the toolbar together. */
export type FileActions = {
  back: () => void;
  forward: () => void;
  up: () => void;
  refresh: () => void;
  selectAll: () => void;
  invert: () => void;
  close: () => void;
  policies: {
    create: () => void;
    clipboard: () => void;
    delete: () => void;
    rename: () => void;
    empty: () => void;
    about: () => void;
    policy: () => void;
    properties: () => void;
  };
  /** Favourites jump straight to a destination. */
  goTo: (id: string) => void;
};

export type FileViewState = {
  view: FileView;
  sort: FileSortKey;
  direction: SortDirection;
};

/** The three layouts, paired with the catalog keys that name them. */
const VIEWS: readonly { id: FileView; key: string }[] = [
  { id: "icons", key: "viewLargeIcons" },
  { id: "list", key: "viewList" },
  { id: "details", key: "viewDetails" },
];

/** The Go menu's favourites, paired with the catalog keys that name them. */
const FAVOURITES: readonly { id: string; key: string }[] = [
  { id: "pc-drive", key: "menuMyComputer" },
  { id: "dir-documents", key: "placeMyDocuments" },
  { id: "dir-archive", key: "placeArchive" },
  { id: "dir-organizations", key: "placeOrganizations" },
  { id: "dir-system", key: "placeSystemFiles" },
];

/**
 * The explorer's furniture: the menu bar, the icon toolbar with the address
 * field on the row beside it, and one of the two status bars. Every item acts or
 * is disabled; the disabled file operations each carry the policy reason, which
 * is why they route to a notice instead of sitting inert.
 */
export function FileMenu({
  state,
  setState,
  canGoBack,
  canGoForward,
  canGoUp,
  actions,
}: {
  state: FileViewState;
  setState: (next: Partial<FileViewState>) => void;
  canGoBack: boolean;
  canGoForward: boolean;
  canGoUp: boolean;
  actions: FileActions;
}) {
  const t = useTranslations("files");
  return (
    <Menubar.Root className="circa-menubar" aria-label={t("menubarLabel")}>
      <Menubar.Menu>
        <Menubar.Trigger className="circa-menutitle">
          {t("menuFile")}
        </Menubar.Trigger>
        <Menubar.Portal>
          <Menubar.Content className="circa-menu" align="start" sideOffset={0}>
            <Menubar.Item
              className="circa-menuitem"
              data-restricted="true"
              onSelect={actions.policies.create}
            >
              {t("newFolder")}
              <span className="circa-menurestricted">{t("restricted")}</span>
            </Menubar.Item>
            <Menubar.Separator className="circa-menuseparator" />
            <Menubar.Item
              className="circa-menuitem"
              data-restricted="true"
              onSelect={actions.policies.rename}
            >
              {t("rename")}
              <span className="circa-menurestricted">{t("restricted")}</span>
            </Menubar.Item>
            <Menubar.Item
              className="circa-menuitem"
              data-restricted="true"
              onSelect={actions.policies.delete}
            >
              {t("delete")}
              <span className="circa-menurestricted">{t("restricted")}</span>
            </Menubar.Item>
            <Menubar.Separator className="circa-menuseparator" />
            <Menubar.Item
              className="circa-menuitem"
              onSelect={actions.policies.properties}
            >
              {t("properties")}
            </Menubar.Item>
            <Menubar.Separator className="circa-menuseparator" />
            <Menubar.Item className="circa-menuitem" onSelect={actions.close}>
              {t("closeWindow")}
            </Menubar.Item>
          </Menubar.Content>
        </Menubar.Portal>
      </Menubar.Menu>

      <Menubar.Menu>
        <Menubar.Trigger className="circa-menutitle">
          {t("menuEdit")}
        </Menubar.Trigger>
        <Menubar.Portal>
          <Menubar.Content className="circa-menu" align="start" sideOffset={0}>
            <Menubar.Item
              className="circa-menuitem"
              onSelect={actions.selectAll}
            >
              {t("selectAll")}
              <span className="circa-menukey">Ctrl+A</span>
            </Menubar.Item>
            <Menubar.Item className="circa-menuitem" onSelect={actions.invert}>
              {t("invertSelection")}
            </Menubar.Item>
            <Menubar.Separator className="circa-menuseparator" />
            <Menubar.Item
              className="circa-menuitem"
              data-restricted="true"
              onSelect={actions.policies.clipboard}
            >
              {t("cut")}
              <span className="circa-menurestricted">{t("restricted")}</span>
            </Menubar.Item>
            <Menubar.Item
              className="circa-menuitem"
              data-restricted="true"
              onSelect={actions.policies.clipboard}
            >
              {t("copy")}
              <span className="circa-menurestricted">{t("restricted")}</span>
            </Menubar.Item>
            <Menubar.Item
              className="circa-menuitem"
              data-restricted="true"
              onSelect={actions.policies.clipboard}
            >
              {t("paste")}
              <span className="circa-menurestricted">{t("restricted")}</span>
            </Menubar.Item>
          </Menubar.Content>
        </Menubar.Portal>
      </Menubar.Menu>

      <Menubar.Menu>
        <Menubar.Trigger className="circa-menutitle">
          {t("menuView")}
        </Menubar.Trigger>
        <Menubar.Portal>
          <Menubar.Content className="circa-menu" align="start" sideOffset={0}>
            <Menubar.Item className="circa-menuitem" onSelect={actions.refresh}>
              {t("refresh")}
              <span className="circa-menukey">F5</span>
            </Menubar.Item>
            <Menubar.Separator className="circa-menuseparator" />
            <Menubar.RadioGroup
              value={state.view}
              onValueChange={(value) => setState({ view: value as FileView })}
            >
              {VIEWS.map((view) => (
                <Menubar.RadioItem
                  key={view.id}
                  className="circa-menuitem"
                  value={view.id}
                >
                  {t(view.key)}
                </Menubar.RadioItem>
              ))}
            </Menubar.RadioGroup>
            <Menubar.Separator className="circa-menuseparator" />
            <Menubar.Label className="circa-menulabel">
              {t("sortBy")}
            </Menubar.Label>
            <Menubar.RadioGroup
              value={state.sort}
              onValueChange={(value) =>
                setState({ sort: value as FileSortKey })
              }
            >
              {SORT_KEYS.map((key) => (
                <Menubar.RadioItem
                  key={key}
                  className="circa-menuitem"
                  value={key}
                >
                  {t(SORT_LABEL_KEYS[key])}
                </Menubar.RadioItem>
              ))}
            </Menubar.RadioGroup>
            <Menubar.Separator className="circa-menuseparator" />
            <Menubar.Item
              className="circa-menuitem"
              onSelect={() =>
                setState({
                  direction:
                    state.direction === "ascending"
                      ? "descending"
                      : "ascending",
                })
              }
            >
              {state.direction === "ascending"
                ? t("descendingOrder")
                : t("ascendingOrder")}
            </Menubar.Item>
          </Menubar.Content>
        </Menubar.Portal>
      </Menubar.Menu>

      <Menubar.Menu>
        <Menubar.Trigger className="circa-menutitle">
          {t("menuGo")}
        </Menubar.Trigger>
        <Menubar.Portal>
          <Menubar.Content className="circa-menu" align="start" sideOffset={0}>
            <Menubar.Item
              className="circa-menuitem"
              disabled={!canGoBack}
              onSelect={actions.back}
            >
              {t("back")}
            </Menubar.Item>
            <Menubar.Item
              className="circa-menuitem"
              disabled={!canGoForward}
              onSelect={actions.forward}
            >
              {t("forward")}
            </Menubar.Item>
            <Menubar.Item
              className="circa-menuitem"
              disabled={!canGoUp}
              onSelect={actions.up}
            >
              {t("upOneLevel")}
            </Menubar.Item>
            <Menubar.Separator className="circa-menuseparator" />
            {FAVOURITES.map((place) => (
              <Menubar.Item
                key={place.id}
                className="circa-menuitem"
                onSelect={() => actions.goTo(place.id)}
              >
                {t(place.key)}
              </Menubar.Item>
            ))}
          </Menubar.Content>
        </Menubar.Portal>
      </Menubar.Menu>

      <Menubar.Menu>
        <Menubar.Trigger className="circa-menutitle">
          {t("menuHelp")}
        </Menubar.Trigger>
        <Menubar.Portal>
          <Menubar.Content className="circa-menu" align="start" sideOffset={0}>
            <Menubar.Item
              className="circa-menuitem"
              onSelect={actions.policies.policy}
            >
              {t("storagePolicy")}
            </Menubar.Item>
            <Menubar.Separator className="circa-menuseparator" />
            <Menubar.Item
              className="circa-menuitem"
              onSelect={actions.policies.about}
            >
              {t("aboutExplorer", { name: EXPLORER_NAME })}
            </Menubar.Item>
          </Menubar.Content>
        </Menubar.Portal>
      </Menubar.Menu>
    </Menubar.Root>
  );
}

/** The icon toolbar: navigation, the five file operations, and the view switch. */
export function FileToolbar({
  state,
  setState,
  canGoBack,
  canGoForward,
  canGoUp,
  showEmptyBin,
  onEmptyBin,
  actions,
}: {
  state: FileViewState;
  setState: (next: Partial<FileViewState>) => void;
  canGoBack: boolean;
  canGoForward: boolean;
  canGoUp: boolean;
  /** Only the Recycle Bin can be emptied, so only its window offers the tool. */
  showEmptyBin: boolean;
  onEmptyBin: () => void;
  actions: FileActions;
}) {
  const t = useTranslations("files");
  return (
    <div
      className="files-toolbar"
      role="toolbar"
      aria-label={t("toolbarLabel")}
    >
      <FileToolButton
        label={t("back")}
        icon={ArrowLeft}
        disabled={!canGoBack}
        onClick={actions.back}
      />
      <FileToolButton
        label={t("forward")}
        icon={ArrowRight}
        disabled={!canGoForward}
        onClick={actions.forward}
      />
      <FileToolButton
        label={t("toolUp")}
        icon={ChevronUp}
        disabled={!canGoUp}
        onClick={actions.up}
      />
      <FileToolButton
        label={t("refresh")}
        icon={RotateCw}
        onClick={actions.refresh}
      />
      <span className="files-toolbar-divider" aria-hidden="true" />
      {/*
        The five file operations are present and refused, not absent: the archive
        mount is read only, and each button says which policy refuses it.
      */}
      <FileToolButton
        label={t("cut")}
        icon={Scissors}
        onClick={actions.policies.clipboard}
      />
      <FileToolButton
        label={t("copy")}
        icon={ClipboardCopy}
        onClick={actions.policies.clipboard}
      />
      <FileToolButton
        label={t("paste")}
        icon={ClipboardPaste}
        onClick={actions.policies.clipboard}
      />
      <span className="files-toolbar-divider" aria-hidden="true" />
      <FileToolButton
        label={t("undo")}
        icon={Undo2}
        onClick={actions.policies.create}
      />
      <FileToolButton
        label={t("delete")}
        icon={Trash2}
        onClick={actions.policies.delete}
      />
      <span className="files-toolbar-divider" aria-hidden="true" />
      {showEmptyBin && (
        <>
          <FileToolButton
            label={t("emptyRecycleBin")}
            icon={Trash2}
            onClick={onEmptyBin}
          />
          <span className="files-toolbar-divider" aria-hidden="true" />
        </>
      )}
      <div className="files-views" role="group" aria-label={t("menuView")}>
        <FileToolButton
          label={t("viewLargeIcons")}
          icon={LayoutGrid}
          pressed={state.view === "icons"}
          onClick={() => setState({ view: "icons" })}
        />
        <FileToolButton
          label={t("viewList")}
          icon={List}
          pressed={state.view === "list"}
          onClick={() => setState({ view: "list" })}
        />
        <FileToolButton
          label={t("viewDetails")}
          icon={Table2}
          pressed={state.view === "details"}
          onClick={() => setState({ view: "details" })}
        />
      </div>
    </div>
  );
}

/** The address row: the path in a sunken trough, a Go button, and the place list. */
export function FileAddressBar({
  address,
  up,
  places,
  current,
  actions,
}: {
  address: string;
  up: boolean;
  places: readonly { id: string; label: string }[];
  current: string;
  actions: FileActions;
}) {
  const t = useTranslations("files");
  return (
    <div className="files-addressrow">
      <label className="files-address-label" htmlFor="files-address">
        {t("addressLabel")}
      </label>
      <span className="files-address-field">
        {up ? (
          <button
            type="button"
            className="files-address-up"
            aria-label={t("upOneLevel")}
            onClick={actions.up}
          >
            <ChevronUp className="files-address-uphglyph" aria-hidden="true" />
          </button>
        ) : (
          <FolderCog className="files-address-glyph" aria-hidden="true" />
        )}
        <input
          id="files-address"
          className="files-address-input"
          type="text"
          readOnly
          spellCheck={false}
          value={address}
          aria-label={t("currentPath")}
        />
      </span>
      <button
        type="button"
        className="files-address-go"
        onClick={actions.refresh}
      >
        {t("addressGo")}
      </button>
      <label className="sr-only" htmlFor="files-place">
        {t("jumpToPlace")}
      </label>
      <select
        id="files-place"
        className="files-place"
        value={current}
        onChange={(event) => actions.goTo(event.target.value)}
      >
        {places.map((place) => (
          <option key={place.id} value={place.id}>
            {place.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Total on the left, selection in the middle, the volume cells on the right. */
export function FileStatus({
  summary,
  selection,
  reference,
}: {
  summary: string;
  selection: string;
  reference: string;
}) {
  const t = useTranslations("files");
  return (
    <div className="files-statusbar">
      <span className="files-status-text" role="status">
        {selection || summary}
      </span>
      <span className="files-status-cell">{summary}</span>
      <span className="files-status-cell">{reference}</span>
      <span className="files-status-cell">{t("readOnly")}</span>
    </div>
  );
}

/** One beveled tool. A pressed tool marks the active view; a disabled one states why. */
function FileToolButton({
  label,
  icon: Icon,
  disabled,
  pressed,
  onClick,
}: {
  label: string;
  icon: typeof ArrowLeft;
  disabled?: boolean;
  pressed?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="files-tool"
      aria-label={label}
      aria-pressed={pressed ? "true" : undefined}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon className="files-tool-glyph" aria-hidden="true" />
      <span className="files-tool-label">{label}</span>
    </button>
  );
}

/**
 * The empty state a folder shows when it has nothing in it. A folder that is
 * empty for a policy reason passes a hint, so _EXPUNGED explains itself while an
 * ordinary empty folder does not claim anything it cannot.
 */
export function FileEmpty({
  folder,
  summary,
  hint,
}: {
  folder: string;
  summary: string | null;
  hint?: string | null;
}) {
  const t = useTranslations("files");
  return (
    <div className="files-empty">
      <FileQuestion className="files-empty-glyph" aria-hidden="true" />
      <p className="files-empty-title">{t("folderEmpty", { folder })}</p>
      <p className="files-empty-note">{summary ?? t("emptyNote")}</p>
      {hint && (
        <p className="files-empty-hint">
          <Info className="files-empty-hintglyph" aria-hidden="true" />
          {hint}
        </p>
      )}
    </div>
  );
}
