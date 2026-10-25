import { useState } from "react";
import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { IncidentEditorWorkspace } from "@/components/incident-editor/workspace";
import {
  createDraft,
  type EditorFont,
  type RegistryEntity,
} from "@/lib/incident-editor/model";
import { renderWithIntl } from "./intl";

vi.mock("@/components/incident-editor/source-editor", () => ({
  SourceEditor: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (value: string) => void;
  }) => (
    <textarea
      aria-label="Incident Markdown"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

vi.stubGlobal("matchMedia", () => ({
  matches: false,
  addEventListener: () => {},
  removeEventListener: () => {},
}));

const registry: RegistryEntity[] = [
  { code: "CHR-018257", name: "Mara Vale", kind: "CHR", usage: "restricted" },
  { code: "CHR-018258", name: "Elias Ward", kind: "CHR", usage: "open" },
];
function Harness() {
  const [draft, setDraft] = useState(createDraft);
  const [font, setFont] = useState<EditorFont>("mono");
  return (
    <IncidentEditorWorkspace
      draft={draft}
      onChange={setDraft}
      registry={registry}
      font={font}
      onFontChange={setFont}
      resolveAsset={() => undefined}
    />
  );
}

describe("incident editor workspace", () => {
  it("retains form answers and Markdown between both tab levels and distinguishes warning choices", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness />);
    await user.type(
      screen.getByLabelText("What is this incident called?"),
      "An empty platform",
    );
    expect(
      screen.getByRole("checkbox", { name: "Warnings not provided" }),
    ).toBeChecked();
    await user.click(
      screen.getByRole("checkbox", { name: "No warnings apply" }),
    );
    await user.click(screen.getByRole("tab", { name: "Content" }));
    fireEvent.change(screen.getByLabelText("Incident Markdown"), {
      target: { value: "## Account\nA witness saw **nothing**." },
    });
    await user.click(screen.getByRole("tab", { name: "Preview" }));
    expect(screen.getByRole("heading", { name: "Account" })).toBeVisible();
    expect(screen.getByText("nothing")).toBeVisible();
    await user.click(screen.getByRole("tab", { name: "Form information" }));
    expect(screen.getByLabelText("What is this incident called?")).toHaveValue(
      "An empty platform",
    );
    expect(
      screen.getByRole("checkbox", { name: "No warnings apply" }),
    ).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Warnings not provided" }),
    ).not.toBeChecked();
    await user.click(screen.getByRole("tab", { name: "Content" }));
    await user.click(screen.getByRole("tab", { name: "Editor" }));
    expect(screen.getByLabelText("Incident Markdown")).toHaveValue(
      "## Account\nA witness saw **nothing**.",
    );
  });

  it("offers the documented content warnings as checkboxes with distinct disclosure states", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness />);
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.map((box) => box.closest("label")?.textContent)).toEqual([
      "Graphic violence",
      "Psychological horror",
      "Sexual violence",
      "Self-harm",
      "Major character death",
      "No warnings apply",
      "Warnings not provided",
    ]);
    expect(
      screen.getByRole("checkbox", { name: "Warnings not provided" }),
    ).toBeChecked();
    const violence = screen.getByRole("checkbox", { name: "Graphic violence" });
    await user.click(violence);
    expect(violence).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Warnings not provided" }),
    ).not.toBeChecked();
    await user.click(
      screen.getByRole("checkbox", { name: "No warnings apply" }),
    );
    expect(
      screen.getByRole("checkbox", { name: "No warnings apply" }),
    ).toBeChecked();
    expect(violence).not.toBeChecked();
  });

  it("requires explicit acknowledgement before importing restricted characters", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness />);
    await user.click(screen.getByRole("tab", { name: "Imports" }));
    await user.click(
      screen.getAllByRole("button", { name: "Import character" })[0],
    );
    const dialog = screen.getByRole("dialog", { name: "Restricted character" });
    expect(
      within(dialog).getByRole("button", { name: "Acknowledge and import" }),
    ).toBeDisabled();
    await user.click(
      within(dialog).getByLabelText(
        "I understand the character usage guidelines.",
      ),
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Acknowledge and import" }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Imported for this draft")).toBeVisible();
  });

  it("renders reference details safely and recovers after malformed YAML", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness />);
    await user.click(screen.getByRole("tab", { name: "Content" }));
    fireEvent.change(screen.getByLabelText("Incident Markdown"), {
      target: { value: "[[CHR-018257]] <script>alert(1)</script>" },
    });
    await user.click(screen.getByRole("tab", { name: "Preview" }));
    await user.click(screen.getByRole("button", { name: "CHR-018257" }));
    expect(
      screen.getByRole("dialog", { name: "Entity details" }),
    ).toHaveTextContent("Mara Vale");
    expect(document.querySelector("script")).toBeNull();
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Close" }),
    );
    await user.click(screen.getByRole("tab", { name: "Editor" }));
    fireEvent.change(screen.getByLabelText("Incident Markdown"), {
      target: { value: "---\nbad: [\n---\nAccount" },
    });
    await user.click(screen.getByRole("tab", { name: "Preview" }));
    expect(screen.getByRole("alert")).toHaveTextContent("cannot be rendered");
    await user.click(screen.getByRole("tab", { name: "Editor" }));
    fireEvent.change(screen.getByLabelText("Incident Markdown"), {
      target: { value: "Repaired account" },
    });
    await user.click(screen.getByRole("tab", { name: "Preview" }));
    expect(
      screen.getByText("Repaired account", { selector: "p" }),
    ).toBeVisible();
  });
});
