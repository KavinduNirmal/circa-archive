import { useState } from "react";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SourceEditor } from "@/components/incident-editor/source-editor";
import { renderWithIntl } from "./intl";

function Harness({ initial = "A witness account" }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return <SourceEditor value={value} onChange={setValue} />;
}
function select(start: number, end: number) {
  const input = screen.getByLabelText(
    "Incident Markdown",
  ) as HTMLTextAreaElement;
  input.focus();
  input.setSelectionRange(start, end);
  fireEvent.select(input);
  return input;
}

describe("incident Markdown quick actions", () => {
  it.each([
    ["Italic", "A *witness* account"],
    ["Bold", "A **witness** account"],
    ["Quote", "> A witness account"],
    ["Inline code", "A `witness` account"],
    ["Code block", "A \n\n```\nwitness\n```\n\n account"],
    ["External reference", "A [witness]() account"],
    ["Internal reference", "A [[witness]] account"],
    ["Redact", "A ||witness|| account"],
  ])("%s formats the selection and can be undone", async (action, expected) => {
    const user = userEvent.setup();
    renderWithIntl(<Harness />);
    const input = select(2, 9);
    await user.click(screen.getByRole("button", { name: action }));
    expect(input).toHaveValue(expected);
    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(input).toHaveValue("A witness account");
  });

  it.each([1, 2, 3, 4, 5, 6])(
    "H%s replaces the current line's heading without stacking markers",
    async (level) => {
      const user = userEvent.setup();
      renderWithIntl(<Harness initial={"Previous paragraph\n## Account"} />);
      const input = select(24, 24);
      await user.selectOptions(
        screen.getByRole("combobox", { name: "Headings" }),
        String(level),
      );
      expect(input).toHaveValue(
        `Previous paragraph\n${"#".repeat(level)} Account`,
      );
    },
  );

  it.each([
    ["External reference", "[link]()"],
    ["Internal reference", "[[]]"],
    ["Redact", "||redact||"],
    ["Inline code", "`code`"],
    ["Code block", "```\ncode\n```"],
  ])(
    "%s provides editable syntax in an empty document",
    async (action, expected) => {
      const user = userEvent.setup();
      renderWithIntl(<Harness initial="" />);
      const input = select(0, 0);
      await user.click(screen.getByRole("button", { name: action }));
      expect(input).toHaveValue(expected);
    },
  );
});
