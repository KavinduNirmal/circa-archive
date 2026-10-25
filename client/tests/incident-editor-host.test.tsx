import { screen, waitFor, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SiteIncidentEditor } from "@/components/incident-editor/site-editor";
import { createDraft, FONT_KEY } from "@/lib/incident-editor/model";
import { renderWithIntl } from "./intl";

vi.mock("@/components/incident-editor/workspace", () => ({
  IncidentEditorWorkspace: ({
    draft,
    onChange,
    font,
    onFontChange,
  }: {
    draft: ReturnType<typeof createDraft>;
    onChange: (draft: ReturnType<typeof createDraft>) => void;
    font: string;
    onFontChange: (font: string) => void;
  }) => (
    <>
      <input
        aria-label="Draft body"
        value={draft.markdown}
        onChange={(event) =>
          onChange({ ...draft, markdown: event.target.value })
        }
      />
      <select
        aria-label="Editor font"
        value={font}
        onChange={(event) => onFontChange(event.target.value)}
      >
        <option value="mono">Monospace</option>
        <option value="sans">Sans serif</option>
        <option value="serif">Serif</option>
      </select>
    </>
  ),
}));
beforeEach(() => localStorage.clear());

describe("site draft host", () => {
  it("flushes pending changes when its route unmounts", async () => {
    const storage = {
      load: vi.fn().mockResolvedValue(createDraft()),
      save: vi.fn().mockResolvedValue(undefined),
    };
    const view = renderWithIntl(<SiteIncidentEditor storage={storage} />);
    fireEvent.change(await screen.findByLabelText("Draft body"), {
      target: { value: "Leaving the route" },
    });
    view.unmount();
    await waitFor(() =>
      expect(storage.save).toHaveBeenCalledWith(
        expect.objectContaining({ markdown: "Leaving the route" }),
      ),
    );
  });

  it("waits for restoration before saving, preserves the saved identity, and saves font choice", async () => {
    const saved = { ...createDraft(), markdown: "An existing account" };
    let finish: (value: typeof saved) => void = () => {};
    const loaded = new Promise<typeof saved>((resolve) => {
      finish = resolve;
    });
    const storage = {
      load: () => loaded,
      save: vi.fn().mockResolvedValue(undefined),
    };
    renderWithIntl(<SiteIncidentEditor storage={storage} />);
    expect(screen.getByRole("status")).toHaveTextContent("Restoring");
    expect(storage.save).not.toHaveBeenCalled();
    finish(saved);
    expect(await screen.findByLabelText("Draft body")).toHaveValue(
      saved.markdown,
    );
    fireEvent.change(screen.getByLabelText("Draft body"), {
      target: { value: "A revised account" },
    });
    await waitFor(() =>
      expect(storage.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: saved.id,
          markdown: "A revised account",
        }),
      ),
    );
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Saved in this browser",
      ),
    );
    fireEvent.change(screen.getByLabelText("Editor font"), {
      target: { value: "serif" },
    });
    expect(localStorage.getItem(FONT_KEY)).toBe("serif");
  });

  it("restores font choice and leaves editing available after a failed save", async () => {
    localStorage.setItem(FONT_KEY, "sans");
    const storage = {
      load: vi.fn().mockResolvedValue(createDraft()),
      save: vi.fn().mockRejectedValue(new Error("quota")),
    };
    renderWithIntl(<SiteIncidentEditor storage={storage} />);
    expect(await screen.findByLabelText("Editor font")).toHaveValue("sans");
    fireEvent.change(screen.getByLabelText("Draft body"), {
      target: { value: "Still editable" },
    });
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Unsaved changes"),
    );
    expect(screen.getByLabelText("Draft body")).toHaveValue("Still editable");
  });

  it("does not overwrite a saved copy when restoration fails", async () => {
    const storage = {
      load: vi.fn().mockRejectedValue(new Error("corrupt")),
      save: vi.fn(),
    };
    renderWithIntl(<SiteIncidentEditor storage={storage} />);
    fireEvent.change(await screen.findByLabelText("Draft body"), {
      target: { value: "An in-memory draft" },
    });
    expect(screen.getByRole("status")).toHaveTextContent("will not overwrite");
    await new Promise((resolve) => setTimeout(resolve, 450));
    expect(storage.save).not.toHaveBeenCalled();
  });
});
