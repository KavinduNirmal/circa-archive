import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { WORD_WINDOW_TITLE } from "@/components/word/word-identity";
import { WordWindow } from "@/components/word/word-window";
import { renderWithIntl } from "./intl";

/** The editor is rendered on its own; the desktop tests cover opening it as a window. */
function openEditor(body = "") {
  const user = userEvent.setup();
  renderWithIntl(<WordWindow initialBody={body} onCloseWindow={() => {}} />);
  const root = document.querySelector<HTMLElement>(".word");
  if (!root) throw new Error("the editor did not render");
  const area = () =>
    within(root).getByLabelText(
      "Record body, in Markdown",
    ) as HTMLTextAreaElement;
  const bar = () =>
    within(root).getByRole("toolbar", { name: "Markdown tools" });
  const tool = (name: string) => within(bar()).getByRole("button", { name });
  const status = () => within(root).getByRole("status").textContent ?? "";
  const menu = async (title: string) => {
    await user.click(within(root).getByRole("menuitem", { name: title }));
    return await screen.findByRole("menu");
  };
  /**
   * Selects a run of the document and lets the component hear about it.
   *
   * The range is set the way the browser sets it, then the `select` event the
   * text area fires is dispatched: that is the event a drag ends with, and it is
   * what the component reads the selection from. jsdom has no hit testing, so a
   * pointer drag cannot produce it here.
   */
  async function select(start: number, end: number) {
    const element = area();
    await user.click(element);
    element.setSelectionRange(start, end);
    fireEvent.select(element);
  }
  return { user, root, area, tool, status, menu, select };
}

describe("record editor", () => {
  it("opens as a word processor: menu bar, format bar, ruler, sheet, and status cells", () => {
    const { root, area, status } = openEditor("# Heading\n\ntwo words");
    expect(
      within(root).getByRole("menubar", { name: "CIRCA Word menu" }),
    ).toBeVisible();
    expect(
      within(root).getByRole("toolbar", { name: "Markdown tools" }),
    ).toBeVisible();
    // The ruler is decorative and hidden from assistive tech rather than announced.
    expect(root.querySelector(".word-ruler")).not.toBeNull();
    expect(
      within(root).getByLabelText("Record body, in Markdown"),
    ).toBeVisible();
    expect(area().value).toBe("# Heading\n\ntwo words");
    // The status bar reports the document and where the caret is.
    expect(status()).toContain("4 words, 3 lines, 20 characters");
    expect(within(root).getByText("Page 1")).toBeVisible();
    expect(within(root).getByText("NORMAL")).toBeVisible();
    expect(within(root).getByText("Unfiled")).toBeVisible();
    // The window frame's own strip is dropped; this window has its own status bar.
    expect(root.querySelector(".window-address")).toBeNull();
  });

  it("carries the markdown tools rather than a picture of the result", () => {
    const { tool } = openEditor("");
    const expected = [
      "Bold",
      "Italic",
      "Strikethrough",
      "Inline code",
      "Heading 1",
      "Heading 2",
      "Heading 3",
      "Bulleted list",
      "Numbered list",
      "Blockquote",
      "Code block",
      "Link",
      "Image",
      "Table",
      "Horizontal rule",
      "Clear formatting",
    ];
    for (const name of expected)
      expect(
        tool(name),
        `${name} is missing from the format bar`,
      ).toBeVisible();
    // Each button states the markdown it writes, so nothing is a guess.
    expect(tool("Bold")).toHaveAttribute("title", "Bold  **bold**");
    expect(tool("Code block")).toHaveAttribute("title", "Code block  ```");
  });

  it("marks up a selection and reports what it did", async () => {
    const { user, area, select, tool, status } = openEditor("bravo");
    await select(0, 5);
    await user.click(tool("Bold"));
    expect(area().value).toBe("**bravo**");
    expect(status()).toContain("Bold applied");
    // The caret comes back with the selection it acted on, so the toolbar stays live.
    expect(area()).toHaveFocus();
  });

  it("toggles a marker off when the selection is already wrapped", async () => {
    const { user, area, select, tool } = openEditor("say **bravo** now");
    await select(6, 11);
    await user.click(tool("Bold"));
    expect(area().value).toBe("say bravo now");
  });

  it("prefixes the line the caret is on for a heading and a list", async () => {
    const { user, area, tool, select } = openEditor("Black dog\nsecond line");
    await select(3, 3);
    await user.click(tool("Heading 1"));
    expect(area().value).toBe("# Black dog\nsecond line");

    // The caret then moves to the second line, which gets its own marker.
    await select(14, 14);
    await user.click(tool("Bulleted list"));
    expect(area().value).toBe("# Black dog\n- second line");
  });

  it("asks for an address before inserting a link, and writes nothing on cancel", async () => {
    const { user, area, select, tool } = openEditor("the brief");
    await select(4, 9);
    await user.click(tool("Link"));
    const strip = within(area().ownerDocument.body).getByRole("form", {
      name: "Link address",
    });
    const field = within(strip).getByLabelText("Link to");
    await user.type(field, "https://archive.local/x");
    await user.click(within(strip).getByRole("button", { name: "Insert" }));
    expect(area().value).toBe("the [brief](https://archive.local/x)");

    // Cancelling the strip leaves the document alone.
    await user.click(tool("Link"));
    await user.click(
      within(
        await screen.findByRole("form", { name: "Link address" }),
      ).getByRole("button", { name: "Cancel" }),
    );
    expect(area().value).toBe("the [brief](https://archive.local/x)");
  });

  it("writes a code fence around the selection", async () => {
    const { user, area, select, tool } = openEditor("const a = 1;");
    await select(0, 12);
    await user.click(tool("Code block"));
    expect(area().value).toBe("```\nconst a = 1;\n```");
  });

  it("keeps one undo step per tool press and one per typing run", async () => {
    const { user, area, select, tool, menu } = openEditor("bravo");
    await select(0, 5);
    await user.click(tool("Bold"));
    expect(area().value).toBe("**bravo**");
    await user.click(
      within(await menu("Edit")).getByRole("menuitem", { name: /Undo/ }),
    );
    expect(area().value).toBe("bravo");
    await user.click(
      within(await menu("Edit")).getByRole("menuitem", { name: /Redo/ }),
    );
    expect(area().value).toBe("**bravo**");
  });

  it("undoes a word the operator typed, not one letter", async () => {
    const { user, area, menu } = openEditor("");
    await user.click(area());
    await user.keyboard("freight car");
    expect(area().value).toBe("freight car");
    await user.click(
      within(await menu("Edit")).getByRole("menuitem", { name: /Undo/ }),
    );
    expect(area().value).toBe("");
  });

  it("keeps a selection the operator made, so the tool acts on it", async () => {
    /*
     * The selection is written back into the text area after every render, which
     * could undo a real click-drag before a tool runs. This is the guard: a
     * selection made the way a drag makes one survives until the tool is pressed.
     */
    const { user, area, tool } = openEditor("bravo");
    const element = area();
    await user.click(element);
    element.setSelectionRange(0, 5);
    fireEvent.select(element);
    // A render happens for the selection event; the selection must still be there.
    expect(element.selectionStart).toBe(0);
    expect(element.selectionEnd).toBe(5);
    await user.click(tool("Italic"));
    expect(element.value).toBe("*bravo*");
  });

  it("drives the tools from the keyboard as well", async () => {
    const { user, area } = openEditor("bravo");
    await user.click(area());
    area().setSelectionRange(0, 5);
    await user.keyboard("{Control>}b{/Control}");
    await waitFor(() => expect(area().value).toBe("**bravo**"));
    await user.keyboard("{Control>}z{/Control}");
    await waitFor(() => expect(area().value).toBe("bravo"));
  });

  it("changes the heading level from the style box instead of stacking markers", async () => {
    const { user, area } = openEditor("# Black dog");
    const style = within(area().ownerDocument.body).getByLabelText(
      "Style",
    ) as HTMLSelectElement;
    expect(style.value).toBe("h1");
    await user.selectOptions(style, "h2");
    expect(area().value).toBe("## Black dog");
    await user.selectOptions(style, "body");
    expect(area().value).toBe("Black dog");
  });

  it("refuses to file the draft, and says which authority is missing", async () => {
    const { user, root } = openEditor("draft");
    await user.click(within(root).getByRole("menuitem", { name: "File" }));
    const file = await screen.findByRole("menu");
    // Save is present and refused with its reason on the item itself. Radix marks
    // a disabled item with `aria-disabled` rather than the `disabled` attribute.
    expect(
      within(file).getByRole("menuitem", { name: /Save/ }),
    ).toHaveAttribute("aria-disabled", "true");
    await user.click(
      within(file).getByRole("menuitem", { name: /File to case/ }),
    );
    const box = await screen.findByRole("alertdialog");
    expect(
      within(box).getByText("This draft cannot be filed yet"),
    ).toBeVisible();
    expect(box).toHaveTextContent("LN-POLICY-26");
  });

  it("reports the text size from the View menu", async () => {
    const { user, root, area } = openEditor("one");
    await user.click(within(root).getByRole("menuitem", { name: "View" }));
    const view = await screen.findByRole("menu");
    await user.click(
      within(view).getByRole("menuitemradio", { name: "LARGE" }),
    );
    expect(within(root).getByRole("status")).toHaveTextContent(
      "Text size: LARGE.",
    );
    expect(root).toHaveAttribute("data-size", "large");
    expect(area().ownerDocument.body.textContent).toContain("LARGE");
  });

  it("hides the ruler from the View menu", async () => {
    const { user, root } = openEditor("one");
    await user.click(within(root).getByRole("menuitem", { name: "View" }));
    const view = await screen.findByRole("menu");
    await user.click(
      within(view).getByRole("menuitemcheckbox", { name: "Ruler" }),
    );
    expect(root).toHaveAttribute("data-ruler", "false");
    expect(root.querySelector(".word-ruler")).toBeNull();
  });

  it("starts a new document from the File menu and clears the history", async () => {
    const { user, root, area, menu } = openEditor("draft");
    await user.click(
      within(await menu("File")).getByRole("menuitem", { name: /New/ }),
    );
    expect(area().value).toBe("");
    // Nothing to undo, so the Edit menu says so rather than offering a dead item.
    const edit = await menu("Edit");
    expect(
      within(edit).getByRole("menuitem", { name: /Undo/ }),
    ).toHaveAttribute("aria-disabled", "true");
    expect(root).toBeVisible();
  });

  it("explains itself in the About and filing policy boxes", async () => {
    const { user, menu } = openEditor("");
    await user.click(
      within(await menu("Help")).getByRole("menuitem", { name: /About/ }),
    );
    const about = await screen.findByRole("alertdialog");
    expect(within(about).getByText("CIRCA Word 2000")).toBeVisible();
    await user.click(within(about).getByRole("button", { name: "OK" }));

    await user.click(
      within(await menu("Help")).getByRole("menuitem", {
        name: "Filing policy",
      }),
    );
    const policy = await screen.findByRole("alertdialog");
    expect(policy).toHaveTextContent(
      "Records are written in Markdown and filed as .pdf into a case folder",
    );
  });

  it("names its own window title, which the shell reads", () => {
    expect(WORD_WINDOW_TITLE).toBe("CIRCA Word - Untitled Record");
    openEditor("");
    expect(screen.getByText(new RegExp(WORD_WINDOW_TITLE))).toBeInTheDocument();
  });
});
