"use client";

import { FOLLOW_UP_LABELS, type ReaderFollowUp } from "./reader-correspondence";
import { READER_VOCABULARY } from "./reader-identity";

/**
 * The strip along the bottom, which is how one record reaches another.
 *
 * A record is not a leaf. It cites other records, and other records cite it,
 * and the second direction is the one that tells you who has been reading this
 * file since it was laid down. Both are shown, and they are shown apart,
 * because merging them would hide which way the citation runs.
 *
 * This is the one part of the viewer that is not called a reference. What the
 * archive files after a record is a follow-up, and the label says so.
 */
export function FollowUpStrip({ inbound, outbound, onOpen }: {
  inbound: readonly ReaderFollowUp[];
  outbound: readonly ReaderFollowUp[];
  onOpen: (code: string) => void;
}) {
  const total = inbound.length + outbound.length;
  return (
    <section className="reader-followups" aria-label={READER_VOCABULARY.followUps}>
      <div className="reader-followups-head">
        <h2 className="reader-followups-title circa-label">{READER_VOCABULARY.followUps}</h2>
        <span className="reader-followups-count circa-mono" data-testid="reader-followup-count">
          {total === 0 ? "None on file" : `${total} on file`}
        </span>
      </div>
      {total === 0
        ? <p className="reader-followups-empty">{READER_VOCABULARY.emptyFollowUps}</p>
        : (
          <div className="reader-followups-groups">
            <FollowUpGroup label={READER_VOCABULARY.filedAgainst} cards={inbound} onOpen={onOpen} />
            <FollowUpGroup label={READER_VOCABULARY.citedIn} cards={outbound} onOpen={onOpen} />
          </div>
        )}
    </section>
  );
}

function FollowUpGroup({ label, cards, onOpen }: {
  label: string;
  cards: readonly ReaderFollowUp[];
  onOpen: (code: string) => void;
}) {
  return (
    <div className="reader-followup-group" data-empty={cards.length === 0 ? "true" : undefined}>
      <h3 className="reader-followup-label circa-label">
        {label}
        <span className="reader-followup-tally circa-mono">{cards.length}</span>
      </h3>
      {cards.length === 0
        ? <p className="reader-followup-none">None filed.</p>
        : (
          <ul className="reader-cards" aria-label={label}>
            {cards.map((card) => (
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
