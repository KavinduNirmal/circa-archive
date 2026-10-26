import "@fontsource/instrument-serif/latin-400.css";
import "@fontsource/ibm-plex-sans/latin-400.css";
import "@fontsource/ibm-plex-sans/latin-400-italic.css";
import "@fontsource/ibm-plex-sans/latin-600.css";

/**
 * The reading edition's own faces.
 *
 * Instrument Serif speaks: the wordmark, a page's title, a record's filing
 * title, every section head. IBM Plex Sans reads: prose, ledes, abstracts,
 * controls, and the tracked uppercase labels. Both are loaded here rather than
 * in the language layout, because the workstation and the project pages have
 * their own voices and should not pay for these.
 *
 * Korean is not webfonted here. Display falls back to the platform Myeongjo and
 * reading to the platform gothic — a real Korean serif and a real Korean sans on
 * every desktop. Shipping Noto Serif KR cost a single 971 KB woff2 on every
 * Korean page; the trade is recorded in `.agents/brain/DESIGN.md`.
 */
export default function PublicArchiveLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
