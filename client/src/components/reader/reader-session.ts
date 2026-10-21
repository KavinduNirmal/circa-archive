import { useCallback, useState } from "react";
import { REVIEWER_HANDLE } from "./reader-identity";
import {
  ANNOTATIONS,
  notesFor,
  type ReaderAnnotation,
  type ReaderReply,
} from "./reader-correspondence";
import type { ReaderSection } from "./reader-model";

/**
 * The reviewer's session.
 *
 * Everything a reader does *about* a record rather than *with* it lives here:
 * who is at the terminal, the notes they have filed, the notes they have
 * endorsed, the assessments they have given, and the votes they have cast.
 *
 * It is workstation state rather than window state, which is why the hook sits
 * in the shell and the viewer receives it as one object. Two things follow from
 * that. Closing the reader does not erase a reviewer's work, and a guest is a
 * guest for every window rather than for the one they happened to open.
 *
 * The session is deliberately not enforced here. This module records what the
 * reviewer did and leaves the asking to the component, so the gate is visible
 * in one place instead of hidden behind a store.
 */

/** Whether a reviewer corroborated the record or contested it. */
export type ReaderVerdict = "corroborate" | "contest";

export type ReaderSession = {
  /** The handle on file, or null while the terminal has no reviewer session. */
  reviewer: string | null;
  /** Notes filed on top of the preview's own correspondence. */
  filed: readonly ReaderAnnotation[];
  /** Replies filed against notes, keyed by the note they answer. */
  replies: Record<string, readonly ReaderReply[]>;
  /** Endorsements added to a note or a reply, keyed by its id. */
  endorsed: Record<string, number>;
  assessments: Record<string, number>;
  verdicts: Record<string, ReaderVerdict>;
  signIn: () => void;
  fileNote: (
    code: string,
    sectionId: string,
    body: string,
    replyTo?: string,
  ) => void;
  endorse: (id: string) => void;
  assess: (code: string, value: number) => void;
  verdict: (code: string, value: ReaderVerdict) => void;
};

type SessionState = {
  reviewer: string | null;
  filed: readonly ReaderAnnotation[];
  replies: Record<string, readonly ReaderReply[]>;
  endorsed: Record<string, number>;
  assessments: Record<string, number>;
  verdicts: Record<string, ReaderVerdict>;
};

const EMPTY_SESSION: SessionState = {
  reviewer: null,
  filed: [],
  replies: {},
  endorsed: {},
  assessments: {},
  verdicts: {},
};

/** The day a filed note is dated, as an ISO day. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useReaderSession(): ReaderSession {
  const [state, setState] = useState<SessionState>(EMPTY_SESSION);

  const signIn = useCallback(() => {
    setState((current) => ({ ...current, reviewer: REVIEWER_HANDLE }));
  }, []);

  const fileNote = useCallback(
    (code: string, sectionId: string, body: string, replyTo?: string) => {
      const text = body.trim();
      if (!text) return;
      setState((current) => {
        if (replyTo) {
          const reply: ReaderReply = {
            id: `reply-filed-${Object.keys(current.replies).length + 1}-${current.filed.length}`,
            author: REVIEWER_HANDLE,
            when: "Just now",
            body: text,
            noted: 0,
          };
          return {
            ...current,
            replies: {
              ...current.replies,
              [replyTo]: [...(current.replies[replyTo] ?? []), reply],
            },
          };
        }
        const note: ReaderAnnotation = {
          id: `note-filed-${current.filed.length + 1}`,
          code,
          sectionId,
          author: REVIEWER_HANDLE,
          when: "Just now",
          filed: today(),
          body: text,
          replies: [],
          noted: 0,
        };
        return { ...current, filed: [...current.filed, note] };
      });
    },
    [],
  );

  const endorse = useCallback((id: string) => {
    setState((current) => ({
      ...current,
      endorsed: { ...current.endorsed, [id]: (current.endorsed[id] ?? 0) + 1 },
    }));
  }, []);

  const assess = useCallback((code: string, value: number) => {
    setState((current) => ({
      ...current,
      assessments: { ...current.assessments, [code]: value },
    }));
  }, []);

  const verdict = useCallback((code: string, value: ReaderVerdict) => {
    setState((current) => ({
      ...current,
      verdicts: { ...current.verdicts, [code]: value },
    }));
  }, []);

  return {
    reviewer: state.reviewer,
    filed: state.filed,
    replies: state.replies,
    endorsed: state.endorsed,
    assessments: state.assessments,
    verdicts: state.verdicts,
    signIn,
    fileNote,
    endorse,
    assess,
    verdict,
  };
}

/** Whether the terminal has a reviewer session, for the controls that need one. */
export function isReviewer(session: ReaderSession): boolean {
  return session.reviewer !== null;
}

/**
 * The whole margin for one record: the correspondence the preview ships, then
 * what this session has filed against it, with endorsements folded in.
 *
 * New notes go last rather than being sorted into place, because a margin is
 * written in order and the note you just filed is the one at the bottom.
 */
export function sessionNotes(
  session: ReaderSession,
  code: string,
  sections: readonly ReaderSection[],
): ReaderAnnotation[] {
  const withEndorsements = (note: ReaderAnnotation): ReaderAnnotation => ({
    ...note,
    noted: note.noted + (session.endorsed[note.id] ?? 0),
    replies: [...note.replies, ...(session.replies[note.id] ?? [])].map(
      (reply) => ({
        ...reply,
        noted: reply.noted + (session.endorsed[reply.id] ?? 0),
      }),
    ),
  });
  return [
    ...notesFor(ANNOTATIONS, code, sections).map(withEndorsements),
    ...notesFor(session.filed, code, sections).map(withEndorsements),
  ];
}
