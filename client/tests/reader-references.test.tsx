import type { ComponentProps } from "react";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ReaderFollowUp } from "@/components/reader/reader-correspondence";
import { FOLLOW_UP_PREVIEW_LIMIT } from "@/components/reader/reader-model";
import { FollowUpStrip } from "@/components/reader/reader-references";
import { renderWithIntl } from "./intl";

/** A card is four fields, so a synthetic list is one line each. */
function cards(count: number): ReaderFollowUp[] {
  return Array.from({ length: count }, (_, index) => ({
    code: `INC-${String(index + 1).padStart(5, "0")}`,
    organization: "ORG-A-020748",
    type: "DISCOVERY" as const,
    preview: `Filed against the record under test, number ${index + 1}.`,
  }));
}

function mount(props: Partial<ComponentProps<typeof FollowUpStrip>> = {}) {
  const onOpen = vi.fn();
  const onToggle = vi.fn();
  const view = renderWithIntl(
    <FollowUpStrip
      code="INC-00042"
      inbound={[]}
      outbound={[]}
      collapsed={false}
      onToggle={onToggle}
      onOpen={onOpen}
      {...props}
    />,
  );
  const rerender = (next: Partial<ComponentProps<typeof FollowUpStrip>>) =>
    view.rerender(
      <FollowUpStrip
        code="INC-00042"
        inbound={[]}
        outbound={[]}
        collapsed={false}
        onToggle={onToggle}
        onOpen={onOpen}
        {...props}
        {...next}
      />,
    );
  return {
    rerender,
    onOpen,
    onToggle,
    strip: screen.getByRole("region", { name: "Subsequent Records" }),
  };
}

describe("follow-up strip", () => {
  it("lists ten at most in a direction, however many are on file", () => {
    const { strip } = mount({ inbound: cards(23) });
    const filed = within(strip).getByRole("list", {
      name: "Filed against this record",
    });
    expect(within(filed).getAllByRole("button")).toHaveLength(
      FOLLOW_UP_PREVIEW_LIMIT,
    );
    // The tally still reports the truth, so the panel never understates the record.
    expect(within(strip).getByText(String(23))).toBeVisible();
  });

  it("says how many it is not showing, and explains the rest in a message box", async () => {
    const user = userEvent.setup();
    const { strip, onOpen } = mount({ inbound: cards(23) });
    const control = within(strip).getByRole("button", { name: "13 not shown" });
    await user.click(control);
    const notice = await screen.findByRole("alertdialog");
    expect(notice).toHaveTextContent("23 records filed against this record");
    expect(notice).toHaveTextContent(
      `the ${FOLLOW_UP_PREVIEW_LIMIT} most recently filed`,
    );
    expect(notice).toHaveTextContent(/on file but not listed here/i);
    expect(notice).toHaveTextContent("INC-00042");
    // The panel explains the cap; it does not try to list or open the remainder.
    expect(onOpen).not.toHaveBeenCalled();
    await user.click(within(notice).getByRole("button", { name: "OK" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("counts each direction separately, since they are two different lists", () => {
    const { strip } = mount({ inbound: cards(23), outbound: cards(14) });
    expect(
      within(strip).getByRole("button", { name: "13 not shown" }),
    ).toBeVisible();
    expect(
      within(strip).getByRole("button", { name: "4 not shown" }),
    ).toBeVisible();
  });

  it("shows no notice while a direction fits inside the limit", async () => {
    const user = userEvent.setup();
    const { strip } = mount({ inbound: cards(FOLLOW_UP_PREVIEW_LIMIT) });
    const filed = within(strip).getByRole("list", {
      name: "Filed against this record",
    });
    expect(within(filed).getAllByRole("button")).toHaveLength(
      FOLLOW_UP_PREVIEW_LIMIT,
    );
    expect(
      within(strip).queryByRole("button", { name: /not shown/ }),
    ).not.toBeInTheDocument();
    // Nothing to explain, so nothing opens.
    await user.click(
      within(strip).getByRole("button", { name: "Hide subsequent records" }),
    );
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("collapses to its head, and the head still reports what is on file", async () => {
    const user = userEvent.setup();
    const { strip, onToggle, rerender } = mount({
      inbound: cards(23),
      outbound: cards(2),
    });
    const hide = within(strip).getByRole("button", {
      name: "Hide subsequent records",
    });
    expect(hide).toHaveAttribute("aria-expanded", "true");
    await user.click(hide);
    // The panel is controlled by whoever owns the record, so it reports the press
    // and waits to be told what happened.
    expect(onToggle).toHaveBeenCalledTimes(1);
    rerender({ collapsed: true, inbound: cards(23), outbound: cards(2) });
    expect(strip).toHaveAttribute("data-collapsed", "true");
    // The lists go; the count and the way back do not.
    expect(within(strip).queryByRole("list")).not.toBeInTheDocument();
    expect(within(strip).getByText("25 on file")).toBeVisible();
    expect(
      within(strip).getByRole("button", { name: "Show subsequent records" }),
    ).toBeVisible();
    rerender({ collapsed: false, inbound: cards(23), outbound: cards(2) });
    expect(strip).not.toHaveAttribute("data-collapsed");
    expect(within(strip).getAllByRole("list")).toHaveLength(2);
  });

  it("says so plainly when nothing has been filed in either direction", () => {
    const { strip } = mount({});
    expect(
      within(strip).getByText("No follow-up records filed."),
    ).toBeVisible();
    expect(within(strip).getByText("None on file")).toBeVisible();
    expect(within(strip).queryByRole("list")).not.toBeInTheDocument();
  });

  it("gives a direction with nothing in it a line rather than an empty row", () => {
    const { strip } = mount({ inbound: cards(3) });
    const cited = within(strip).getByText("None filed.");
    expect(cited).toBeVisible();
    expect(
      within(strip).getByRole("list", { name: "Filed against this record" }),
    ).toBeVisible();
  });
});
