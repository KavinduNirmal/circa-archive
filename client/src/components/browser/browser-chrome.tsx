"use client";

import {
  ArrowLeft,
  ArrowRight,
  Home,
  Lock,
  Plus,
  RotateCw,
  Square,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Menubar } from "radix-ui";
import { TEXT_SIZE_MESSAGE_KEYS, type ArchiveTextSize } from "./archive-page";
import "../ui/menubar.css";

/** Every chrome action the browser owns, passed to the menu and the toolbar together. */
export type BrowserActions = {
  back: () => void;
  forward: () => void;
  home: () => void;
  refresh: () => void;
  newTab: () => void;
  about: () => void;
  policy: () => void;
  closeWindow: () => void;
};

const TEXT_SIZES: readonly ArchiveTextSize[] = ["small", "normal", "large"];

/**
 * The browser's own furniture: menu bar, toolbar and address, the pinned tab
 * strip, and the status bar. All of it is workstation chrome, so it stays in the
 * steel palette; only the page inside the tab is the archive's paper document.
 *
 * Every menu item does something. Items that cannot act here (Back with no
 * history, Stop with no transfer, bookmarking on a restricted zone) are disabled
 * and carry the reason, rather than sitting inert.
 */
export function BrowserMenu({
  textSize,
  onTextSizeChange,
  canGoBack,
  canGoForward,
  actions,
}: {
  textSize: ArchiveTextSize;
  onTextSizeChange: (next: ArchiveTextSize) => void;
  canGoBack: boolean;
  canGoForward: boolean;
  actions: BrowserActions;
}) {
  const t = useTranslations("browser");
  return (
    <Menubar.Root className="circa-menubar" aria-label={t("menuBarLabel")}>
      <Menubar.Menu>
        <Menubar.Trigger className="circa-menutitle">
          {t("menuFile")}
        </Menubar.Trigger>
        <Menubar.Portal>
          <Menubar.Content className="circa-menu" align="start" sideOffset={0}>
            <Menubar.Item className="circa-menuitem" onSelect={actions.newTab}>
              {t("newTab")}
              <span className="circa-menukey">Ctrl+T</span>
            </Menubar.Item>
            <Menubar.Separator className="circa-menuseparator" />
            <Menubar.Item
              className="circa-menuitem"
              onSelect={actions.closeWindow}
            >
              {t("closeWindow")}
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
            <Menubar.Label className="circa-menulabel">
              {t("textSize")}
            </Menubar.Label>
            <Menubar.RadioGroup
              value={textSize}
              onValueChange={(value) =>
                onTextSizeChange(value as ArchiveTextSize)
              }
            >
              {TEXT_SIZES.map((size) => (
                <Menubar.RadioItem
                  key={size}
                  className="circa-menuitem"
                  value={size}
                >
                  {t(TEXT_SIZE_MESSAGE_KEYS[size])}
                </Menubar.RadioItem>
              ))}
            </Menubar.RadioGroup>
          </Menubar.Content>
        </Menubar.Portal>
      </Menubar.Menu>

      <Menubar.Menu>
        <Menubar.Trigger className="circa-menutitle">{t("go")}</Menubar.Trigger>
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
            <Menubar.Separator className="circa-menuseparator" />
            <Menubar.Item className="circa-menuitem" onSelect={actions.home}>
              {t("archiveHome")}
            </Menubar.Item>
          </Menubar.Content>
        </Menubar.Portal>
      </Menubar.Menu>

      <Menubar.Menu>
        <Menubar.Trigger className="circa-menutitle">
          {t("menuBookmarks")}
        </Menubar.Trigger>
        <Menubar.Portal>
          <Menubar.Content className="circa-menu" align="start" sideOffset={0}>
            <Menubar.Item
              className="circa-menuitem"
              data-current="true"
              onSelect={actions.home}
            >
              {t("internalArchive")}
            </Menubar.Item>
            <Menubar.Separator className="circa-menuseparator" />
            <Menubar.Item
              className="circa-menuitem"
              disabled
              title={t("bookmarkDisabled")}
            >
              {t("addBookmark")}
            </Menubar.Item>
          </Menubar.Content>
        </Menubar.Portal>
      </Menubar.Menu>

      <Menubar.Menu>
        <Menubar.Trigger className="circa-menutitle">
          {t("menuHelp")}
        </Menubar.Trigger>
        <Menubar.Portal>
          <Menubar.Content className="circa-menu" align="start" sideOffset={0}>
            <Menubar.Item className="circa-menuitem" onSelect={actions.policy}>
              {t("networkPolicy")}
            </Menubar.Item>
            <Menubar.Separator className="circa-menuseparator" />
            <Menubar.Item className="circa-menuitem" onSelect={actions.about}>
              {t("aboutBrowser")}
            </Menubar.Item>
          </Menubar.Content>
        </Menubar.Portal>
      </Menubar.Menu>
    </Menubar.Root>
  );
}

/** Navigation buttons and the fixed-address bar, on the one row a 1999 browser gave them. */
export function BrowserToolbar({
  address,
  onAddressChange,
  onAddressSubmit,
  canGoBack,
  canGoForward,
  actions,
}: {
  address: string;
  onAddressChange: (next: string) => void;
  onAddressSubmit: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
  actions: BrowserActions;
}) {
  const t = useTranslations("browser");
  return (
    <div className="browser-toolbar">
      <div className="browser-nav">
        <ToolbarButton
          label={t("back")}
          icon={ArrowLeft}
          disabled={!canGoBack}
          onClick={actions.back}
        />
        <ToolbarButton
          label={t("forward")}
          icon={ArrowRight}
          disabled={!canGoForward}
          onClick={actions.forward}
        />
        {/* Stop stays disabled because this browser never has a transfer to abort; the title says so. */}
        <ToolbarButton
          label={t("stop")}
          icon={Square}
          disabled
          title={t("stopReason")}
          onClick={actions.policy}
        />
        <ToolbarButton
          label={t("refresh")}
          icon={RotateCw}
          onClick={actions.refresh}
        />
        <ToolbarButton label={t("home")} icon={Home} onClick={actions.home} />
      </div>
      <form
        className="browser-address"
        onSubmit={(event) => {
          event.preventDefault();
          onAddressSubmit();
        }}
      >
        <label className="browser-address-label" htmlFor="browser-address">
          {t("address")}
        </label>
        <span className="browser-address-field">
          <Lock className="browser-address-lock" aria-hidden="true" />
          <input
            id="browser-address"
            className="browser-address-input circa-mono"
            type="text"
            spellCheck={false}
            autoComplete="off"
            aria-describedby="browser-address-note"
            value={address}
            onChange={(event) => onAddressChange(event.target.value)}
          />
          <span className="sr-only" id="browser-address-note">
            {t("addressNote")}
          </span>
        </span>
        <button type="submit" className="browser-go">
          {t("go")}
        </button>
      </form>
    </div>
  );
}

/**
 * One permanent tab. It cannot be closed and never changes its label, so the
 * archive is always the document behind it; activating it returns to the index.
 */
export function BrowserTabs({
  onOpenHome,
  onNewTab,
}: {
  onOpenHome: () => void;
  onNewTab: () => void;
}) {
  const t = useTranslations("browser");
  return (
    <div className="browser-tabstrip">
      <div
        className="browser-tablist"
        role="tablist"
        aria-label={t("tabsLabel")}
      >
        <button
          type="button"
          role="tab"
          id="browser-tab-archive"
          className="browser-tab"
          aria-selected="true"
          aria-controls="browser-page"
          onClick={onOpenHome}
        >
          <Image
            className="browser-tab-icon"
            src="/icons/directory_open_cabinet_fc-2.png"
            alt=""
            width={16}
            height={16}
            draggable={false}
            unoptimized
          />
          <span>{t("internalArchive")}</span>
          <Lock className="browser-tab-lock" aria-hidden="true" />
        </button>
      </div>
      <button
        type="button"
        className="browser-newtab"
        aria-label={t("newTab")}
        onClick={onNewTab}
      >
        <Plus className="browser-newtab-glyph" aria-hidden="true" />
      </button>
    </div>
  );
}

/** Left segment narrates the last action; right cells name the zone and clearance. */
export function BrowserStatus({ status }: { status: string }) {
  const t = useTranslations("browser");
  return (
    <div className="browser-statusbar">
      <span className="browser-status-text" role="status">
        {status}
      </span>
      <span className="browser-status-cell">
        <Lock className="browser-status-glyph" aria-hidden="true" />
        {t("zoneLocalIntranet")}
      </span>
      <span className="browser-status-cell">{t("clearanceLevel")}</span>
    </div>
  );
}

function ToolbarButton({
  label,
  icon: Icon,
  disabled,
  title,
  onClick,
}: {
  label: string;
  icon: typeof ArrowLeft;
  disabled?: boolean;
  title?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="browser-tool"
      aria-label={label}
      disabled={disabled}
      title={title}
      onClick={onClick}
    >
      <Icon className="browser-tool-glyph" aria-hidden="true" />
      <span className="browser-tool-label">{label}</span>
    </button>
  );
}
