const docs = document.querySelector<HTMLElement>("[data-docs]");
if (docs) {
  const disclosure = docs.querySelector<HTMLDetailsElement>(
    ".chapter-disclosure",
  )!;
  const desktop = matchMedia("(min-width: 900px)");
  disclosure.open = desktop.matches;
  desktop.addEventListener("change", (event) => {
    disclosure.open = event.matches;
  });
  const input = docs.querySelector<HTMLInputElement>("#documentation-search")!;
  const status = docs.querySelector<HTMLElement>("[data-search-status]")!;
  const retry = docs.querySelector<HTMLButtonElement>("[data-search-retry]")!;
  const chapters = [
    ...docs.querySelectorAll<HTMLDetailsElement>("[data-chapter]"),
  ];
  const items = [...docs.querySelectorAll<HTMLElement>("[data-topic]")];
  const key = `circa-chapters:${document.documentElement.lang}`;
  let searching = false;
  let beforeSearch: boolean[] = [];
  let index: { slug: string; title: string; text: string }[] | null = null;
  let pending: Promise<void> | null = null;
  try {
    const stored = JSON.parse(sessionStorage.getItem(key) ?? "{}") as Record<
      string,
      boolean
    >;
    chapters.forEach((chapter) => {
      if (typeof stored[chapter.dataset.chapter!] === "boolean")
        chapter.open = stored[chapter.dataset.chapter!];
    });
  } catch {
    /* Storage is optional: native disclosures still work. */
  }
  chapters.find((chapter) =>
    chapter.querySelector('[aria-current="page"]'),
  )!.open = true;
  chapters.forEach((chapter) =>
    chapter.addEventListener("toggle", () => {
      if (!searching)
        try {
          sessionStorage.setItem(
            key,
            JSON.stringify(
              Object.fromEntries(
                chapters.map((group) => [group.dataset.chapter, group.open]),
              ),
            ),
          );
        } catch {
          /* Optional preference only. */
        }
    }),
  );
  async function loadIndex() {
    if (index) return;
    if (pending) return pending;
    status.textContent = docs!.dataset.loading!;
    retry.hidden = true;
    pending = (async () => {
      try {
        const response = await fetch(docs!.dataset.index!);
        if (!response.ok) throw new Error("Index unavailable");
        const data: unknown = await response.json();
        if (
          !Array.isArray(data) ||
          !data.every(
            (entry) =>
              typeof entry.slug === "string" &&
              typeof entry.title === "string" &&
              typeof entry.text === "string",
          )
        )
          throw new Error("Invalid index");
        index = data;
        status.textContent = "";
        applySearch();
      } catch {
        status.textContent = docs!.dataset.error!;
        retry.hidden = false;
      } finally {
        pending = null;
      }
    })();
    return pending;
  }
  function applySearch() {
    const query = input.value.trim().toLocaleLowerCase();
    if (query && !index) {
      void loadIndex();
      return;
    }
    if (query && !searching) {
      beforeSearch = chapters.map((chapter) => chapter.open);
      searching = true;
    }
    let matches = 0;
    const matched = new Set(
      index
        ?.filter((entry) =>
          `${entry.title} ${entry.text}`.toLocaleLowerCase().includes(query),
        )
        .map((entry) => entry.slug),
    );
    items.forEach((item) => {
      item.hidden = !!query && !matched.has(item.dataset.topic!);
      if (!item.hidden) matches++;
    });
    chapters.forEach((chapter, i) => {
      chapter.hidden =
        !!query &&
        ![...chapter.querySelectorAll<HTMLElement>("[data-topic]")].some(
          (item) => !item.hidden,
        );
      if (query) chapter.open = !chapter.hidden;
      else if (searching) chapter.open = beforeSearch[i];
    });
    if (!query) {
      searching = false;
      status.textContent = "";
    } else
      status.textContent = matches
        ? `${matches} ${docs!.dataset.results}`
        : docs!.dataset.empty!;
  }
  input.addEventListener("focus", () => {
    void loadIndex();
  });
  input.addEventListener("input", applySearch);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      input.value = "";
      applySearch();
    }
  });
  retry.addEventListener("click", () => {
    void loadIndex();
  });
  if (location.hash === "#documentation-search") {
    docs.querySelector<HTMLDetailsElement>(".chapter-disclosure")!.open = true;
    input.focus();
  }
}

const article = document.querySelector<HTMLElement>("[data-document-source]");
if (article) {
  const status = article.querySelector<HTMLElement>("[data-copy-status]")!;
  let markdown: string | null = null;
  async function copy(context = false) {
    try {
      if (markdown === null) {
        const response = await fetch(article!.dataset.documentSource!);
        if (!response.ok) throw new Error("Source unavailable");
        markdown = await response.text();
      }
      await navigator.clipboard.writeText(
        context
          ? `${article!.dataset.context}\n\n${article!.dataset.sourceUrl}\n\n${markdown}`
          : markdown,
      );
      status.textContent = context
        ? article!.dataset.paste!
        : article!.dataset.copied!;
    } catch {
      status.textContent = article!.dataset.failed!;
    }
  }
  article.querySelector("[data-chat]")?.addEventListener("click", () => {
    void copy(true);
  });
  article.querySelectorAll<HTMLPreElement>(".prose pre").forEach((pre) => {
    const button = document.createElement("button");
    const copyLabel = article.dataset.copyLabel!;
    button.textContent = copyLabel;
    button.type = "button";
    button.className = "copy-code";
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(
          pre.querySelector("code")?.textContent?.replace(/\n$/, "") ?? "",
        );
        button.textContent = article!.dataset.copied!;
      } catch {
        button.textContent = article!.dataset.failed!;
      }
    });
    pre.append(button);
  });
  const links = [
    ...document.querySelectorAll<HTMLAnchorElement>('.doc-toc a[href^="#"]'),
  ];
  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible)
        links.forEach((link) => {
          if (link.hash === `#${visible.target.id}`)
            link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
    },
    { rootMargin: "-100px 0px -65% 0px" },
  );
  article
    .querySelectorAll(".prose h2,.prose h3")
    .forEach((heading) => observer.observe(heading));
}
