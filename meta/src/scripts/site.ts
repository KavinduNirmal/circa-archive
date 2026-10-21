const locale = document.documentElement.lang;
const mobile = document.querySelector<HTMLDetailsElement>("[data-mobile-menu]");
mobile?.addEventListener("toggle", () =>
  document.body.classList.toggle("menu-open", mobile.open),
);
const menus = [
  ...document.querySelectorAll<HTMLDetailsElement>(".nav-disclosure"),
];
menus.forEach((menu) =>
  menu.addEventListener("toggle", () => {
    if (menu.open)
      menus
        .filter((other) => other !== menu)
        .forEach((other) => {
          other.open = false;
        });
  }),
);
document.addEventListener("click", (event) => {
  menus
    .filter((menu) => !menu.contains(event.target as Node))
    .forEach((menu) => {
      menu.open = false;
    });
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    const opened = menus.find((menu) => menu.open);
    if (opened) {
      opened.open = false;
      opened.querySelector("summary")?.focus();
    } else if (mobile?.open) {
      mobile.open = false;
      mobile.querySelector("summary")?.focus();
    }
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    const search = document.querySelector<HTMLInputElement>(
      "#documentation-search",
    );
    if (search) {
      const chapter = document.querySelector<HTMLDetailsElement>(
        ".chapter-disclosure",
      );
      if (chapter) chapter.open = true;
      search.focus();
    } else location.assign(`/${locale}/documentation/#documentation-search`);
  }
});
document.querySelector("[data-top]")?.addEventListener("click", (event) => {
  event.preventDefault();
  window.scrollTo({
    top: 0,
    behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth",
  });
});
function followLegacyFragment() {
  const target = [
    ...document.querySelectorAll<HTMLAnchorElement>("[data-legacy-target]"),
  ].find((link) => `#${link.id}` === location.hash);
  if (target) location.replace(target.href);
}
followLegacyFragment();
window.addEventListener("hashchange", followLegacyFragment);
