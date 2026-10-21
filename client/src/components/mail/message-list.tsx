"use client";

import { useTranslations } from "next-intl";
import {
  ChevronDown,
  ChevronUp,
  Mail,
  MailOpen,
  Paperclip,
} from "lucide-react";
import {
  isUnread,
  type MailMessage,
  type MailSort,
  type MailSortColumn,
} from "./mailbox-index";

const COLUMNS: readonly {
  id: MailSortColumn;
  key: string;
  className: string;
}[] = [
  { id: "from", key: "columnFrom", className: "mail-col-from" },
  { id: "subject", key: "columnSubject", className: "mail-col-subject" },
  { id: "received", key: "columnReceived", className: "mail-col-received" },
];

export type MessageListProps = {
  messages: readonly MailMessage[];
  read: ReadonlySet<string>;
  selectedId: string | null;
  sort: MailSort;
  onSort: (column: MailSortColumn) => void;
  onSelect: (message: MailMessage) => void;
};

/**
 * The message grid.
 *
 * Rows are selectable and keyboard reachable, which is what a mail list is: the
 * table is a `grid`, the selected row carries `aria-selected`, and Enter or Space
 * opens the message the way a click does. Unread mail is marked by weight and by
 * an envelope glyph as well as by colour, and the sortable headers announce their
 * direction through `aria-sort` instead of relying on the arrow alone.
 */
export function MessageList({
  messages,
  read,
  selectedId,
  sort,
  onSelect,
  onSort,
}: MessageListProps) {
  const t = useTranslations("mail");
  return (
    <div className="mail-grid-scroll">
      <table className="mail-grid" role="grid" aria-label={t("gridLabel")}>
        <thead>
          <tr>
            <th
              scope="col"
              className="mail-col-state"
              aria-sort={ariaSortFor("importance", sort)}
            >
              <span className="mail-glyph-slot">
                <SortHeader
                  column="importance"
                  label={t("columnImportance")}
                  sort={sort}
                  onSort={onSort}
                  compact
                />
                {/* Visible mark so the column is identifiable, not only sortable. */}
                <span className="mail-header-importance" aria-hidden="true">
                  !
                </span>
              </span>
              <span className="mail-glyph-slot" aria-hidden="true" />
              <span className="mail-glyph-slot" aria-hidden="true" />
            </th>
            {COLUMNS.map((column) => (
              <th
                key={column.id}
                scope="col"
                className={column.className}
                aria-sort={ariaSortFor(column.id, sort)}
              >
                <SortHeader
                  column={column.id}
                  label={t(column.key)}
                  sort={sort}
                  onSort={onSort}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {messages.map((message) => {
            const unread = isUnread(message, read);
            return (
              <tr
                key={message.id}
                className="mail-row"
                tabIndex={0}
                aria-selected={message.id === selectedId}
                data-unread={unread ? "true" : undefined}
                onClick={() => onSelect(message)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return;
                  event.preventDefault();
                  onSelect(message);
                }}
              >
                {/* One fixed slot per glyph, so the marks line up down the column. */}
                <td className="mail-col-state">
                  <span className="mail-glyph-slot">
                    {message.importance === "high" && (
                      <span
                        className="mail-importance"
                        data-level="high"
                        title={t("highImportance")}
                      >
                        !
                      </span>
                    )}
                    {message.importance === "low" && (
                      <span
                        className="mail-importance"
                        data-level="low"
                        title={t("lowImportance")}
                      >
                        ↓
                      </span>
                    )}
                  </span>
                  <span className="mail-glyph-slot">
                    {unread ? (
                      <Mail
                        className="mail-glyph"
                        aria-label={t("markUnread")}
                      />
                    ) : (
                      <MailOpen
                        className="mail-glyph mail-glyph-read"
                        aria-label={t("markRead")}
                      />
                    )}
                  </span>
                  <span className="mail-glyph-slot">
                    {message.attachments?.length ? (
                      <Paperclip
                        className="mail-glyph"
                        aria-label={t("markAttachment")}
                      />
                    ) : null}
                  </span>
                </td>
                <td className="mail-col-from">{message.from.name}</td>
                <td className="mail-col-subject">
                  {message.subject}
                  {message.returned && (
                    <span className="mail-returned">
                      {" "}
                      {t("returnedSuffix")}
                    </span>
                  )}
                </td>
                <td className="mail-col-received font-mono">
                  {message.received}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {messages.length === 0 && (
        <p className="mail-grid-empty">{t("emptyGrid")}</p>
      )}
    </div>
  );
}

/** A column header that sorts, and reports the direction it is sorting in. */
function SortHeader({
  column,
  label,
  sort,
  onSort,
  compact = false,
}: {
  column: MailSortColumn;
  label: string;
  sort: MailSort;
  onSort: (column: MailSortColumn) => void;
  compact?: boolean;
}) {
  const active = sort.column === column;
  return (
    <button
      type="button"
      className="mail-sort"
      onClick={() => onSort(column)}
      data-active={active ? "true" : undefined}
    >
      <span className="sr-only">{label}</span>
      {compact
        ? null
        : active &&
          (sort.direction === "asc" ? (
            <ChevronUp className="mail-sort-glyph" aria-hidden="true" />
          ) : (
            <ChevronDown className="mail-sort-glyph" aria-hidden="true" />
          ))}
    </button>
  );
}

/** The `aria-sort` value a column header should carry. */
export function ariaSortFor(
  column: MailSortColumn,
  sort: MailSort,
): "ascending" | "descending" | "none" {
  if (sort.column !== column) return "none";
  return sort.direction === "asc" ? "ascending" : "descending";
}
