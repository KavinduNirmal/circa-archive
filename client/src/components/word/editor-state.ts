/**
 * The editor's state.
 *
 * A reducer rather than a pile of `useState` calls, so undo is the whole of the
 * text state and nothing can reach the document except through an action. The
 * reducer is pure: no DOM, no refs, no timers. The component owns the text area
 * and the selection, and feeds this.
 *
 * Undo is a stack of snapshots. A new edit clears the redo branch, which is what
 * every editor does and what keeps the two buttons honest about their own state.
 */

import {
  applyChange,
  detectActive,
  markupStyle,
  textStats,
  type MarkdownToolId,
  type TextSelection,
  type TextStats,
} from "./document-model";
import type { TextSize } from "./word-identity";

/** The initial document: an empty page with the caret at the top. */
export const EMPTY_DOCUMENT = "";

export type EditorState = {
  past: readonly string[];
  present: string;
  future: readonly string[];
  selection: TextSelection;
  /** The tools the caret is inside, refreshed whenever the selection moves. */
  active: readonly MarkdownToolId[];
  /** Whether the caret's line is a heading, for the style box and the ruler. */
  style: "body" | "heading";
  /** The tool whose address strip is open, if any. */
  address: { tool: "link" | "image"; value: string } | null;
  /** Whether the text area holds the caret. Nothing else shows a cursor. */
  focused: boolean;
  size: TextSize;
  ruler: boolean;
  /** What the status bar last reported. */
  notice: string | null;
  /**
   * When the last edit landed. Keystrokes inside the window share one undo step,
   * so Ctrl+Z after a sentence removes the sentence rather than a letter.
   *
   * A timestamp rather than a "still typing" flag because the text area fires a
   * selection event after every keystroke, and a flag would be cleared by that
   * echo before the next key arrived.
   */
  marked: number;
  /** True when the last thing that happened was a tool press, which ends the run. */
  toolPress: boolean;
  /** Bumped by New, so the text area remounts and the browser drops its undo stack. */
  revision: number;
};

export type EditorAction =
  /** `at` is when the edit happened, so a run of keystrokes can share one step. */
  | { type: "change"; text: string; selection: TextSelection; at?: number }
  | { type: "tool"; tool: MarkdownToolId; address?: string }
  | { type: "selection"; selection: TextSelection }
  | { type: "focus"; focused: boolean }
  | { type: "address"; tool: "link" | "image" | null }
  | { type: "addressValue"; value: string }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "new" }
  /** Puts a line in the status bar. */
  | { type: "report"; message: string }
  /** Clears the status report, which is what a menu opening does. */
  | { type: "quiet" }
  | { type: "size"; size: TextSize }
  | { type: "ruler"; ruler: boolean }
  | { type: "about" };

/** How many edits the editor remembers. Well past what anyone reaches for. */
export const HISTORY_LIMIT = 100;

/**
 * How long a keystroke continues the previous undo step.
 *
 * A pause, a paste, or a tool press starts a new step, which is the behaviour
 * every editor has: Ctrl+Z removes the sentence you just typed, not the letter.
 */
export const TYPING_WINDOW_MS = 900;

/**
 * Whether a change is a keystroke at the caret rather than an edit elsewhere.
 *
 * The run must also touch the caret the operator left behind: typing appends
 * where the cursor is, while a paste at the front of the document does not, even
 * though both are small adjacent edits. Everything that is not a keystroke keeps
 * its own undo step.
 */
function isKeystroke(before: string, after: string, caret: TextSelection): boolean {
  const shorter = before.length <= after.length ? before : after;
  const longer = before.length <= after.length ? after : before;
  if (longer.length - shorter.length > 32) return false;
  let head = 0;
  while (head < shorter.length && shorter[head] === longer[head]) head += 1;
  let tail = 0;
  while (tail < shorter.length - head && shorter[shorter.length - 1 - tail] === longer[longer.length - 1 - tail]) tail += 1;
  if (tail !== shorter.length - head) return false;
  // `head` is where the edited run begins, `tail` is where it ends in each string.
  const runEndInLonger = longer.length - tail;
  const runEndInShorter = shorter.length - tail;
  return (head <= caret.start && caret.end <= runEndInShorter) || (head <= caret.start && caret.end <= runEndInLonger);
}

/**
 * Turns text plus a selection into the derived fields.
 *
 * Every branch that moves the caret goes through here, so the pressed tools, the
 * style box, and the statistics can never disagree with the selection they
 * describe.
 */
function withDocument(state: EditorState, text: string, selection: TextSelection): EditorState {
  const clamped = { start: Math.max(0, Math.min(selection.start, text.length)), end: Math.max(0, Math.min(selection.end, text.length)) };
  const line = text.slice(0, clamped.start).split("\n").pop() ?? "";
  return {
    ...state,
    present: text,
    selection: clamped,
    active: detectActive(text, clamped),
    style: markupStyle(line),
  };
}

/** The caret's line and column, one-based, as the status bar prints them. */
export function cursorPosition(text: string, selection: TextSelection): { line: number; column: number } {
  const lines = text.slice(0, selection.start).split("\n");
  return { line: lines.length, column: (lines[lines.length - 1]?.length ?? 0) + 1 };
}

export function editorStats(state: EditorState): TextStats {
  return textStats(state.present);
}

export function canUndo(state: EditorState): boolean {
  return state.past.length > 0;
}

export function canRedo(state: EditorState): boolean {
  return state.future.length > 0;
}

export function initialState(body = EMPTY_DOCUMENT): EditorState {
  const base: EditorState = {
    past: [],
    present: body,
    future: [],
    selection: { start: body.length, end: body.length },
    active: [],
    style: "body",
    address: null,
    focused: false,
    size: "normal",
    ruler: true,
    notice: null,
    marked: 0,
    toolPress: false,
    revision: 0,
  };
  return withDocument(base, body, base.selection);
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "change": {
      const at = action.at ?? Date.now();
      if (action.text === state.present) return withDocument(state, action.text, action.selection);
      // A keystroke inside the window continues the last undo step. Everything
      // else, including a pause, starts a new one.
      const continues = !state.toolPress && isKeystroke(state.present, action.text, state.selection) && at - state.marked <= TYPING_WINDOW_MS;
      const past = continues ? state.past : [...state.past, state.present].slice(-HISTORY_LIMIT);
      return withDocument({ ...state, past, future: [], marked: at, toolPress: false }, action.text, action.selection);
    }
    case "tool": {
      const result = applyChange(state.present, { tool: action.tool, selection: state.selection, address: action.address });
      return withDocument({
        ...state,
        past: [...state.past, state.present].slice(-HISTORY_LIMIT),
        future: [],
        address: null,
        // A tool press ends the typing run, so the next keystroke is its own step.
        marked: 0,
        toolPress: true,
      }, result.text, result.selection);
    }
    case "selection":
      return withDocument(state, state.present, action.selection);
    case "focus":
      return { ...state, focused: action.focused };
    case "address":
      return { ...state, address: action.tool ? { tool: action.tool, value: state.address?.value ?? "" } : null };
    case "addressValue":
      return { ...state, address: state.address ? { ...state.address, value: action.value } : null };
    case "undo": {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      return withDocument({
        ...state,
        past: state.past.slice(0, -1),
        future: [state.present, ...state.future].slice(0, HISTORY_LIMIT),
        toolPress: true,
      }, previous, { start: previous.length, end: previous.length });
    }
    case "redo": {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      return withDocument({
        ...state,
        past: [...state.past, state.present].slice(-HISTORY_LIMIT),
        future: state.future.slice(1),
        toolPress: true,
      }, next, { start: next.length, end: next.length });
    }
    case "new":
      return { ...initialState(), size: state.size, ruler: state.ruler, focused: true, revision: state.revision + 1 };
    case "report":
      return { ...state, notice: action.message };
    case "quiet":
      return state.notice === null ? state : { ...state, notice: null };
    case "size":
      return { ...state, size: action.size, notice: `Text size: ${action.size}.` };
    case "ruler":
      return { ...state, ruler: action.ruler, notice: action.ruler ? "Ruler shown." : "Ruler hidden." };
    case "about":
      return { ...state, notice: "CIRCA Word, build 1999.4." };
  }
}
