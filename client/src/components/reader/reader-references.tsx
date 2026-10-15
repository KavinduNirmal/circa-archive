"use client";

import { useState } from "react";
import { PanelBottom } from "lucide-react";
import { MessageBox } from "../ui/message-box";
import { FOLLOW_UP_LABELS, type ReaderFollowUp } from "./reader-correspondence";
import { READER_NAME, READER_VOCABULARY } from "./reader-identity";
import { FOLLOW_UP_PREVIEW_LIMIT } from "./reader-model";

/**
 * The strip along the bottom, which is how one record reaches another.
 *
 * A record is not a leaf. It cites other records, and other records cite it, and
 * the second direction is the one that tells you who has been reading this file
 * since it was laid down. Both are shown, and they are shown apart, because
 * merging them would hide which way the citation runs.
 *
 * A record can be cited hundreds of times, and a reading surface is the wrong
 * place to work through a hundred of anything, so each direction lists the ten
 * most recent and states how many it is holding back. The rest are not reachable
 * from here: the panel explains the cap in a message box and stops. That is the
 * point of the cap rather than a limitation of it. A file browser is where a
 * hundred records belong, and this screen is not one.
 *
 * The whole strip can be put away, which is what a reader wants when the filing
 * tray is longer than the document. Collapsing it is structural rather than a
 * style, so the lists leave the accessibility tree with the pixels.
 */

export function FollowUpStrip({ code, inbound, outbound, collapsed, onToggle, onOpen }: {
  /** The record on the sheet, named in the message box that explains the cap. */
  code: string | null;
  inbound: readonly ReaderFollowUp[];
  outbound: readonly ReaderFollowUp[];
  collapsed: boolean;
  onToggle: () => void;
  onOpen: (code: string) => void;
}) {
  const [overflow, setOverflow] = useState<{ heading: string } | null>(null);
  const total = inbound.length + outbound.length;
  return (
    <section className="reader-followups" data-collapsed={collapsed ? "true" : undefined}
      aria-label={READER_VOCABULARY.followUps}>
      <div className="reader-followups-head">
        <h2 className="reader-followups-title circa-label">{READER_VOCABULARY.followUps}</h2>
        <span className="reader-followups-count circa-mono" data-testid="reader-followup-count">
          {total === 0 ? "None on file" : `${total} on file`}
        </span>
        <button type="button" className="reader-followups-toggle" aria-expanded={!collapsed}
          aria-controls={collapsed ? undefined : "reader-followup-lists"} onClick={onToggle}>
          <PanelBottom className="reader-followups-toggle-glyph" aria-hidden="true" />
          <span className="sr-only">{collapsed ? "Show subsequent records" : "Hide subsequent records"}</span>
        </button>
      </div>

      {!collapsed && (
        <div className="reader-followups-body" id="reader-followup-lists">
          {total === 0
            ? <p className="reader-followups-empty">{READER_VOCABULARY.emptyFollowUps}</p>
            : (
              <div className="reader-followups-groups">
                <FollowUpGroup label={READER_VOCABULARY.filedAgainst} cards={inbound} onOpen={onOpen}
                  onOverflow={() => setOverflow({ heading: `${inbound.length} records filed against this record` })} />
                <FollowUpGroup label={READER_VOCABULARY.citedIn} cards={outbound} onOpen={onOpen}
                  onOverflow={() => setOverflow({ heading: `${outbound.length} records cited in this record` })} />
              </div>
            )}
        </div>
      )}

      <MessageBox open={overflow !== null} title={READER_NAME} tone="info"
        heading={overflow?.heading ?? ""}
        body={`The panel lists the ${FOLLOW_UP_PREVIEW_LIMIT} most recently filed. The remainder are on file but not listed here.`}
        detail={code}
        onClose={() => setOverflow(null)} />
    </section>
  );
}

function FollowUpGroup({ label, cards, onOpen, onOverflow }: {
  label: string;
  cards: readonly ReaderFollowUp[];
  onOpen: (code: string) => void;
  onOverflow: () => void;
}) {
  const shown = cards.slice(0, FOLLOW_UP_PREVIEW_LIMIT);
  const hidden = cards.length - shown.length;
  return (
    <div className="reader-followup-group" data-empty={cards.length === 0 ? "true" : undefined}>
      <div className="reader-followup-head">
        <h3 className="reader-followup-label circa-label">
          {label}
          <span className="reader-followup-tally circa-mono">{cards.length}</span>
        </h3>
        {hidden > 0 && (
          <button type="button" className="reader-followup-more" onClick={onOverflow}>{hidden} not shown</button>
        )}
      </div>
      {cards.length === 0
        ? <p className="reader-followup-none">None filed.</p>
        : (
          <ul className="reader-cards" aria-label={label}>
            {shown.map((card) => (
              <li key={card.code}>
                <FollowUpCard card={card} onOpen={onOpen} />
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}

/** One citing record, as a file card: code, holder, how it was filed, and a line of it. */
function FollowUpCard({ card, onOpen }: { card: ReaderFollowUp; onOpen: (code: string) => void }) {
  const kind = FOLLOW_UP_LABELS[card.type].toLowerCase();
  return (
    <button type="button" className="reader-card" data-type={card.type} onClick={() => onOpen(card.code)}
      /* The card is four stacked runs of text, which reads as one unbroken string
         without this: the button says its own sentence instead. */
      aria-label={`${card.code}, filed by ${card.organization} as a ${kind}. ${card.preview}`}>
      <span className="reader-card-top">
        <span className="reader-card-code circa-mono">{card.code}</span>
        <span className="reader-card-type circa-label">{FOLLOW_UP_LABELS[card.type]}</span>
      </span>
      <span className="reader-card-org">{card.organization}</span>
      <span className="reader-card-preview">{card.preview}</span>
    </button>
  );
}
