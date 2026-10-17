"use client";

import * as React from "react";
import { ArrowUpRight, Menu } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { LanguageSwitcher } from "../language-switcher";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "../ui/navigation-menu";

export type MetaNavItem = Readonly<{ label: string; href: string }>;
export type MetaNavGroup = Readonly<{
  label: string;
  items: readonly MetaNavItem[];
  /** The overview link at the foot of the panel; omitted on mobile. */
  overview?: MetaNavItem;
}>;

export type MetaNavLabels = Readonly<{
  brand: string;
  brandTail: string;
  menu: string;
  menuLabel: string;
  close: string;
  home: string;
  docs: string;
  about: string;
  archive: string;
  workstation: string;
  archiveCta: string;
  sourceCta: string;
  skip: string;
}>;

type MetaNavProps = Readonly<{
  labels: MetaNavLabels;
  groups: readonly MetaNavGroup[];
  repositoryUrl: string;
}>;

/**
 * The project page's navigation: a restyled shadcn NavigationMenu on desktop,
 * a Sheet on small screens.
 *
 * Every label arrives as a prop from the server layout. The meta namespace is
 * not shipped to the browser, so the one client island the header needs is the
 * navigation itself, not the catalog behind it.
 */
export function MetaNav({ labels, groups, repositoryUrl }: MetaNavProps) {
  const pathname = usePathname() ?? "/meta";
  const [open, setOpen] = React.useState(false);

  /* The nav is the one place that knows where the reader is; it reads the path
     it is already rendered under rather than being told by four layouts. */
  const current =
    pathname.startsWith("/meta/documentation") ? "docs"
    : pathname.startsWith("/meta/about") ? "about"
    : pathname.startsWith("/site") ? "archive"
    : pathname.startsWith("/desktop") ? "workstation"
    : "home";

  type TopLink = Readonly<{ key: string; label: string; href: string; current: boolean }>;

  /* Home lives at the language root's meta page, not at the locale root, which
     is the fiction's portal; the reader must be able to come back here. */
  const homeLink: TopLink = { key: "home", label: labels.home, href: "/meta", current: current === "home" };
  const sectionLinks: readonly TopLink[] = [
    { key: "about", label: labels.about, href: "/meta/about", current: current === "about" },
    { key: "workstation", label: labels.workstation, href: "/desktop", current: current === "workstation" },
  ];

  const sheetLinks: readonly TopLink[] = [
    homeLink,
    sectionLinks[0],
    { key: "archive", label: labels.archive, href: "/site", current: current === "archive" },
    sectionLinks[1],
  ];

  const navLink = (link: TopLink) => (
    <NavigationMenuItem key={link.key}>
      <NavigationMenuLink asChild>
        <Link
          className="meta-nav-link"
          href={link.href}
          data-active={link.current ? "true" : undefined}
          aria-current={link.current ? "page" : undefined}
        >
          <span className="meta-nav-slash" aria-hidden="true">
            /
          </span>
          {link.label}
        </Link>
      </NavigationMenuLink>
    </NavigationMenuItem>
  );

  return (
    <header className="meta-header">
      <div className="meta-shell meta-header-inner">
        <Link className="meta-brand" href="/meta" aria-label={labels.brand}>
          <img className="meta-brand-mark" src="/circa_eye.svg" alt="" width={26} height={24} />
          <span className="meta-brand-word">CIRCA</span>
          <span className="meta-brand-tail">{labels.brandTail}</span>
        </Link>

        <NavigationMenu className="meta-nav-desktop" aria-label={labels.menuLabel} viewport={false}>
          <NavigationMenuList className="meta-nav-list">
            {navLink(homeLink)}

            <NavigationMenuItem>
              <NavigationMenuTrigger className="meta-nav-link" data-active={current === "docs" ? "true" : undefined}>
                <span className="meta-nav-slash" aria-hidden="true">
                  /
                </span>
                {labels.docs}
              </NavigationMenuTrigger>
              <NavigationMenuContent className="meta-nav-panel-wrap">
                <div className="meta-nav-panel">
                  <div className="meta-nav-panel-groups">
                    {groups.map((group) => (
                      <div className="meta-nav-panel-group" key={group.label}>
                        <p className="meta-nav-panel-title">{group.label}</p>
                        <ul>
                          {group.items.map((item) => (
                            <li key={item.href}>
                              <NavigationMenuLink asChild>
                                <Link
                                  className="meta-nav-panel-link"
                                  href={item.href}
                                  aria-current={pathname === item.href ? "page" : undefined}
                                >
                                  {item.label}
                                </Link>
                              </NavigationMenuLink>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <div className="meta-nav-panel-foot">
                    <a className="meta-nav-panel-source" href={repositoryUrl} target="_blank" rel="noreferrer">
                      {labels.sourceCta}
                      <ArrowUpRight aria-hidden="true" size={12} />
                    </a>
                  </div>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {sectionLinks.map(navLink)}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="meta-header-tools">
          <LanguageSwitcher className="meta-language" />
          <Link className="meta-nav-cta" href="/site">
            {labels.archiveCta}
            <ArrowUpRight aria-hidden="true" size={13} />
          </Link>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="meta-menu-button" aria-label={labels.menu}>
              <Menu aria-hidden="true" size={20} />
            </SheetTrigger>
            <SheetContent
              side="right"
              title={labels.menu}
              description={labels.menuLabel}
              closeLabel={labels.close}
              className="meta-sheet"
            >
              <div className="meta-sheet-head">
                <Link className="meta-brand" href="/meta" onClick={() => setOpen(false)}>
                  <img className="meta-brand-mark" src="/circa_eye.svg" alt="" width={26} height={24} />
                  <span className="meta-brand-word">CIRCA</span>
                  <span className="meta-brand-tail">{labels.brandTail}</span>
                </Link>
              </div>

              <nav className="meta-sheet-nav" aria-label={labels.menuLabel}>
                <div className="meta-sheet-group">
                  <p className="meta-sheet-title">{labels.menuLabel}</p>
                  {sheetLinks.map((link) => (
                    <Link
                      key={link.key}
                      className="meta-sheet-link"
                      href={link.href}
                      onClick={() => setOpen(false)}
                      data-active={link.current ? "true" : undefined}
                      aria-current={link.current ? "page" : undefined}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>

                <div className="meta-sheet-group">
                  <p className="meta-sheet-title">{labels.docs}</p>
                  {groups.map((group) =>
                    group.items.map((item) => (
                      <Link
                        key={item.href}
                        className="meta-sheet-link"
                        href={item.href}
                        onClick={() => setOpen(false)}
                        aria-current={pathname === item.href ? "page" : undefined}
                      >
                        {item.label}
                      </Link>
                    )),
                  )}
                </div>
              </nav>

              <div className="meta-sheet-foot">
                <LanguageSwitcher className="meta-sheet-language" />
                <Link className="meta-button meta-sheet-cta" href="/site" onClick={() => setOpen(false)}>
                  {labels.archiveCta}
                  <ArrowUpRight aria-hidden="true" size={14} />
                </Link>
                <a className="meta-sheet-source" href={repositoryUrl} target="_blank" rel="noreferrer">
                  {labels.sourceCta}
                  <ArrowUpRight aria-hidden="true" size={12} />
                </a>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
