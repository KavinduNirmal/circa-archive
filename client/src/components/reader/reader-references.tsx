"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PanelBottom } from "lucide-react";
import { MessageBox } from "../ui/message-box";
import { FOLLOW_UP_LABELS, type ReaderFollowUp } from "./reader-correspondence";
import { READER_NAME } from "./reader-identity";
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
  const t = useTranslations("reader");
  const [overflow, setOverflow] = useState<{ heading: string } | null>(null);
  const total = inbound.length + outbound.length;
  return (
    <section className="reader-followups" data-collapsed={collapsed ? "true" : undefined}
      aria-label={t("followUps")}>
      <div className="reader-followups-head">
        <h2 className="reader-followups-title circa-label">{t("followUps")}</h2>
        <span className="reader-followups-count circa-mono" data-testid="reader-followup-count">
          {total === 0 ? t("noneOnFile") : t("onFile", { count: total })}
        </span>
        <button type="button" className="reader-followups-toggle" aria-expanded={!collapsed}
          aria-controls={collapsed ? undefined : "reader-followup-lists"} onClick={onToggle}>
          <PanelBottom className="reader-followups-toggle-glyph" aria-hidden="true" />
          <span className="sr-only">{collapsed ? t("showFollowUps") : t("hideFollowUps")}</span>
        </button>
      </div>

      {!collapsed && (
        <div className="reader-followups-body" id="reader-followup-lists">
          {total === 0
            ? <p className="reader-followups-empty">{t("emptyFollowUps")}</p>
            : (
              <div className="reader-followups-groups">
                <FollowUpGroup label={t("filedAgainst")} cards={inbound} onOpen={onOpen}
                  onOverflow={() => setOverflow({ heading: t("overflowFiledAgainst", { count: inbound.length }) })} />
                <FollowUpGroup label={t("citedIn")} cards={outbound} onOpen={onOpen}
                  onOverflow={() => setOverflow({ heading: t("overflowCitedIn", { count: outbound.length }) })} />
              </div>
            )}
        </div>
      )}

      <MessageBox open={overflow !== null} title={READER_NAME} tone="info"
        heading={overflow?.heading ?? ""}
        body={t("overflowBody", { limit: FOLLOW_UP_PREVIEW_LIMIT })}
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
  const t = useTranslations("reader");
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
          <button type="button" className="reader-followup-more" onClick={onOverflow}>{t("notShown", { count: hidden })}</button>
        )}
      </div>
      {cards.length === 0
        ? <p className="reader-followup-none">{t("noneFiled")}</p>
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
  const t = useTranslations("reader");
  const kind = FOLLOW_UP_LABELS[card.type].toLowerCase();
  return (
    <button type="button" className="reader-card" data-type={card.type} onClick={() => onOpen(card.code)}
      /* The card is four stacked runs of text, which reads as one unbroken string
         without this: the button says its own sentence instead. */
      aria-label={t("cardLabel", { code: card.code, organization: card.organization, kind, preview: card.preview })}>
      <span className="reader-card-top">
        <span className="reader-card-code circa-mono">{card.code}</span>
        <span className="reader-card-type circa-label">{FOLLOW_UP_LABELS[card.type]}</span>
      </span>
      <span className="reader-card-org">{card.organization}</span>
      <span className="reader-card-preview">{card.preview}</span>
    </button>
  );
}
