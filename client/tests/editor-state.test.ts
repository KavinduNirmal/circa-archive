import { describe, expect, it } from "vitest";
import {
  HISTORY_LIMIT,
  canRedo,
  canUndo,
  cursorPosition,
  editorReducer,
  editorStats,
  initialState,
  type EditorAction,
  type EditorState,
} from "@/components/word/editor-state";

/** Runs a sequence of actions over a fresh document. */
function run(...actions: EditorAction[]): EditorState {
  return actions.reduce(editorReducer, initialState());
}

/** Types a string one character at a time, the way a keyboard delivers it. */
function type(state: EditorState, value: string): EditorState {
  return [...value].reduce((current, character) => {
    const text = `${current.present.slice(0, current.selection.start)}${character}${current.present.slice(current.selection.end)}`;
    const caret = current.selection.start + 1;
    return editorReducer(current, {
      type: "change",
      text,
      selection: { start: caret, end: caret },
    });
  }, state);
}

describe("derived state", () => {
  it("starts empty with the caret at the top and nothing to undo", () => {
    const state = initialState();
    expect(state.present).toBe("");
    expect(state.selection).toEqual({ start: 0, end: 0 });
    expect(canUndo(state)).toBe(false);
    expect(canRedo(state)).toBe(false);
    expect(state.size).toBe("normal");
    expect(state.ruler).toBe(true);
  });

  it("reports the caret's line and column from the text", () => {
    expect(cursorPosition("one\ntwo", { start: 0, end: 0 })).toEqual({
      line: 1,
      column: 1,
    });
    expect(cursorPosition("one\ntwo", { start: 6, end: 6 })).toEqual({
      line: 2,
      column: 3,
    });
    expect(cursorPosition("", { start: 0, end: 0 })).toEqual({
      line: 1,
      column: 1,
    });
  });

  it("counts the document for the status bar", () => {
    const state = run({
      type: "change",
      text: "one two\nthree",
      selection: { start: 13, end: 13 },
    });
    expect(editorStats(state)).toEqual({
      words: 3,
      lines: 2,
      characters: 13,
      paragraphs: 1,
    });
  });
});

describe("typing and undo", () => {
  it("coalesces a run of keystrokes into one undo step", () => {
    const typed = type(initialState(), "freight car");
    expect(typed.present).toBe("freight car");
    const undone = editorReducer(typed, { type: "undo" });
    expect(undone.present).toBe("");
    expect(canUndo(undone)).toBe(false);
  });

  it("redoes what it undid, and stops at the end of the branch", () => {
    const typed = type(initialState(), "one");
    const undone = editorReducer(typed, { type: "undo" });
    const redone = editorReducer(undone, { type: "redo" });
    expect(redone.present).toBe("one");
    expect(canRedo(redone)).toBe(false);
    // Undo and redo past their own ends are no-ops rather than errors.
    expect(editorReducer(undone, { type: "undo" }).present).toBe("");
    expect(editorReducer(redone, { type: "redo" }).present).toBe("one");
  });

  it("starts a new undo step when the document is edited away from the caret", () => {
    const typed = type(initialState(), "one two");
    // A paste at the front is not a keystroke, so it keeps its own step.
    const pasted = editorReducer(typed, {
      type: "change",
      text: "zero one two",
      selection: { start: 4, end: 4 },
    });
    expect(pasted.past).toHaveLength(2);
    expect(editorReducer(pasted, { type: "undo" }).present).toBe("one two");
  });

  it("keeps the redo branch only while it is unbroken", () => {
    const typed = type(initialState(), "one");
    const undone = editorReducer(typed, { type: "undo" });
    expect(canRedo(undone)).toBe(true);
    const retyped = type(undone, "two");
    expect(canRedo(retyped)).toBe(false);
  });

  it("bounds the history so a long session cannot grow without limit", () => {
    let state = initialState();
    for (let index = 0; index < HISTORY_LIMIT + 20; index += 1) {
      const text = state.present + "x";
      const caret = text.length;
      state = editorReducer(state, {
        type: "change",
        text: `\n${index} ${text}`,
        selection: { start: caret + 4, end: caret + 4 },
      });
    }
    expect(state.past.length).toBeLessThanOrEqual(HISTORY_LIMIT);
  });
});

describe("the typing window", () => {
  /** Types one character at a known time, the way a keyboard delivers it. */
  function keystroke(
    state: EditorState,
    at: number,
    character: string,
    position = state.selection.end,
  ): EditorState {
    const text = `${state.present.slice(0, position)}${character}${state.present.slice(position)}`;
    const caret = position + 1;
    return editorReducer(state, {
      type: "change",
      text,
      selection: { start: caret, end: caret },
      at,
    });
  }

  it("merges keystrokes inside the window into one undo step", () => {
    let state = keystroke(initialState(), 1_000, "f");
    state = keystroke(state, 1_100, "r");
    expect(state.present).toBe("fr");
    expect(state.past).toHaveLength(1);
    expect(editorReducer(state, { type: "undo" }).present).toBe("");
  });

  it("starts a new step after a pause, so a sentence is not one edit", () => {
    let state = keystroke(initialState(), 1_000, "f");
    state = keystroke(state, 1_000 + 5_000, "r");
    expect(state.past).toHaveLength(2);
    expect(editorReducer(state, { type: "undo" }).present).toBe("f");
  });

  it("starts a new step after a tool press", () => {
    let state = keystroke(initialState(), 1_000, "one");
    state = editorReducer(state, {
      type: "selection",
      selection: { start: 0, end: 3 },
    });
    state = editorReducer(state, { type: "tool", tool: "bold" });
    const afterTool = state.past.length;
    state = keystroke(state, 1_050, "!");
    expect(state.past).toHaveLength(afterTool + 1);
  });
});

describe("tools through the reducer", () => {
  it("applies a tool and reports the pressed state at the new caret", () => {
    // Type a word, select it, and make it bold.
    const typed = type(initialState(), "bravo");
    const selected = editorReducer(typed, {
      type: "selection",
      selection: { start: 0, end: 5 },
    });
    const bolded = editorReducer(selected, { type: "tool", tool: "bold" });
    expect(bolded.present).toBe("**bravo**");
    expect(bolded.active).toContain("bold");
    expect(canUndo(bolded)).toBe(true);
    // One Ctrl+Z is one tool press, not one typing run and one tool press.
    expect(editorReducer(bolded, { type: "undo" }).present).toBe("bravo");
  });

  it("reports the heading style from the caret's line", () => {
    const typed = type(initialState(), "Black dog");
    const heading = editorReducer(typed, { type: "tool", tool: "heading1" });
    expect(heading.present).toBe("# Black dog");
    expect(heading.style).toBe("heading");
    expect(heading.active).toContain("heading1");
    expect(heading.active).not.toContain("heading2");
    expect(heading.style).toBe("heading");
    // Moving the caret onto a plain line takes the style reading with it.
    const moved = editorReducer(heading, {
      type: "change",
      text: `${heading.present}\nplain`,
      selection: {
        start: heading.present.length + 7,
        end: heading.present.length + 7,
      },
    });
    expect(moved.style).toBe("body");
  });

  it("reports a body line as body text and a heading as a heading", () => {
    const body = run({
      type: "change",
      text: "plain prose",
      selection: { start: 11, end: 11 },
    });
    expect(body.style).toBe("body");
    // Switching a heading level replaces the marker instead of stacking one.
    const first = editorReducer(body, { type: "tool", tool: "heading2" });
    expect(first.present).toBe("## plain prose");
    const second = editorReducer(first, { type: "tool", tool: "heading3" });
    expect(second.present).toBe("### plain prose");
    expect(second.active).toContain("heading3");
    expect(second.active).not.toContain("heading2");
  });

  it("opens an address strip for a link, takes the address, and closes it", () => {
    const selected = editorReducer(type(initialState(), "brief"), {
      type: "selection",
      selection: { start: 0, end: 5 },
    });
    const asking = editorReducer(selected, { type: "address", tool: "link" });
    expect(asking.address).toEqual({ tool: "link", value: "" });
    const filled = editorReducer(asking, {
      type: "addressValue",
      value: "https://archive.local/x",
    });
    const linked = editorReducer(filled, {
      type: "tool",
      tool: "link",
      address: filled.address?.value,
    });
    expect(linked.present).toBe("[brief](https://archive.local/x)");
    expect(linked.address).toBeNull();
    // Cancelling the strip writes nothing into the document.
    const cancelled = editorReducer(asking, { type: "address", tool: null });
    expect(cancelled.address).toBeNull();
    expect(cancelled.present).toBe("brief");
  });

  it("starts a new document and clears the history with it", () => {
    const typed = type(initialState(), "draft");
    const fresh = editorReducer(typed, { type: "new" });
    expect(fresh.present).toBe("");
    expect(canUndo(fresh)).toBe(false);
    // The revision changes so the text area remounts and the browser drops its
    // own undo stack, which would otherwise fight this one.
    expect(fresh.revision).toBe(typed.revision + 1);
  });

  it("keeps the view settings across a new document", () => {
    const configured = run(
      { type: "size", size: "large" },
      { type: "ruler", ruler: false },
    );
    const fresh = editorReducer(configured, { type: "new" });
    expect(fresh.size).toBe("large");
    expect(fresh.ruler).toBe(false);
  });
});

describe("status reports", () => {
  it("reports a view change and can be quieted", () => {
    const sized = run({ type: "size", size: "large" });
    expect(sized.notice).toEqual({ key: "textSizeNotice", size: "large" });
    expect(editorReducer(sized, { type: "quiet" }).notice).toBeNull();
  });

  it("reports the build in its About line", () => {
    expect(run({ type: "about" }).notice).toEqual({ key: "buildNotice" });
  });

  it("tracks where the caret is", () => {
    expect(
      editorReducer(initialState(), { type: "focus", focused: true }).focused,
    ).toBe(true);
  });
});
