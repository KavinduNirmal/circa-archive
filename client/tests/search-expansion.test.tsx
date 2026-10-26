import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { SearchForm } from "@/components/archive-site/search-form";
import { parseSearchState } from "@/lib/search/query";
import { renderWithIntl } from "./intl";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  localStorage.clear();
});

it("replaces the query and selected facets when navigating to another committed search", () => {
  const view = renderWithIntl(
    <SearchForm values={parseSearchState({ q: "door", type: "incident" })} />,
  );
  fireEvent.change(
    screen.getByRole("combobox", { name: "Search the archive" }),
    { target: { value: "draft" } },
  );
  view.rerender(
    <SearchForm values={parseSearchState({ q: "garden", type: "record" })} />,
  );
  expect(
    screen.getByRole("combobox", { name: "Search the archive" }),
  ).toHaveValue("garden");
  expect(
    document.querySelector('input[name="type"][value="record"]'),
  ).toBeInTheDocument();
  expect(
    document.querySelector('input[name="type"][value="incident"]'),
  ).not.toBeInTheDocument();
});

it("debounces API suggestions without changing the committed browser URL", async () => {
  vi.useFakeTimers();
  const fetcher = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      items: [{ displayCode: "INC-880001", title: "Door" }],
    }),
  });
  vi.stubGlobal("fetch", fetcher);
  renderWithIntl(<SearchForm source="api" />);
  const url = window.location.href;
  fireEvent.change(
    screen.getByRole("combobox", { name: "Search the archive" }),
    { target: { value: "do" } },
  );
  await act(() => vi.advanceTimersByTimeAsync(319));
  expect(fetcher).not.toHaveBeenCalled();
  await act(() => vi.advanceTimersByTimeAsync(1));
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(
    document.querySelector('datalist option[value="INC-880001"]'),
  ).toBeInTheDocument();
  expect(window.location.href).toBe(url);
  fireEvent.change(screen.getByLabelText("Search language"), {
    target: { value: "ko" },
  });
  await act(() => vi.advanceTimersByTimeAsync(320));
  expect(fetcher.mock.calls.at(-1)?.[0]).toContain("language=ko");
  fireEvent.change(
    screen.getByRole("combobox", { name: "Search the archive" }),
    { target: { value: "" } },
  );
  expect(document.querySelector("datalist option")).not.toBeInTheDocument();
});

it("keeps saved searches usable when browser storage rejects writes", () => {
  const view = renderWithIntl(
    <SearchForm values={parseSearchState({ q: "door" })} />,
  );
  const storage = vi
    .spyOn(Storage.prototype, "setItem")
    .mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });
  fireEvent.change(screen.getByLabelText("Name this search"), {
    target: { value: "Doors" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save search" }));
  expect(screen.getByRole("link", { name: "Doors" })).toBeInTheDocument();
  view.unmount();
  storage.mockRestore();
});

it("saves the canonical index address even from another archive page", () => {
  window.history.replaceState(null, "", "/en/site");
  renderWithIntl(
    <SearchForm variant="masthead" values={parseSearchState({ q: "door" })} />,
  );
  fireEvent.change(screen.getByLabelText("Name this search"), {
    target: { value: "Doors" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save search" }));
  expect(screen.getByRole("link", { name: "Doors" })).toHaveAttribute(
    "href",
    "/en/site/records?q=door",
  );
  window.history.replaceState(null, "", "/");
});
