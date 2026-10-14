import Link from "next/link";
import { CopyCommand } from "./copy-command";
import { TERMINAL } from "./terminal-copy";
import {
  BRIEF,
  BUILDER_STEPS,
  DOCUMENTS,
  FILINGS,
  HINGE,
  LAYOUT,
  ORGANIZATIONS,
  PROJECT,
  SPECIMEN,
  STACK,
  TRACKS,
  WRITER_FILINGS,
  WRITER_RULES,
  WRITER_STEPS,
  classLabel,
  commandById,
  statusLabel,
  type Track,
} from "./site-meta";

/**
 * The public landing page, in two movements.
 *
 * The first movement is the archive itself, written in the institution's voice
 * over its own index: a masthead, the three duties, the entries on file, one
 * filing set as paper, and the bodies the archive files under. The second is
 * the project, on paper, divided into the two kinds of contributor it needs.
 * A hinge names the change out loud, because a page that slips from fiction to
 * recruitment without saying so is the one thing worse than either half.
 *
 * Composition is deliberate rather than even: the masthead owns a viewport of
 * quiet, a constant label rail anchors every scene, dense ledgers alternate
 * with airy clauses, and the two full-bleed bands (hinge, closing) mark the
 * movements the way a document's sections break.
 */

/** A scene: a rail carrying the § number and one word, then the body. */
function Scene({ id, index, rail, heading, note, children, className }: {
  id: string;
  index: string;
  rail: string;
  heading: string;
  note?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={["scene", className].filter(Boolean).join(" ")} id={id} aria-labelledby={`${id}-title`}>
      <p className="scene-rail">
        <span className="scene-index circa-mono">{index}</span>
        <span className="scene-word">{rail}</span>
      </p>
      <div className="scene-body">
        <h2 className="scene-title" id={`${id}-title`}>
          {heading}
        </h2>
        {note && <p className="scene-note">{note}</p>}
        {children}
      </div>
    </section>
  );
}

function TerminalBar() {
  return (
    <header className="terminal-bar">
      <span className="terminal-sys">
        <span className="terminal-sys-mark" aria-hidden="true">
          ▦
        </span>
        {TERMINAL.system}
      </span>
      <span className="terminal-node">{TERMINAL.node}</span>
      <span className="terminal-spacer" />
      <span className="terminal-clearance">{TERMINAL.clearance}</span>
      <a className="terminal-jump" href="#brief">
        The project behind the archive
      </a>
    </header>
  );
}

function TerminalMasthead() {
  return (
    <div className="terminal-masthead">
      <span className="terminal-seal" aria-hidden="true" />
      <div className="terminal-identity">
        <h1 className="terminal-wordmark" id="terminal-title">
          {TERMINAL.wordmark}
        </h1>
        <p className="terminal-commission">{PROJECT.commission}</p>
        <p className="terminal-line">
          <span className="terminal-address circa-mono">{TERMINAL.address}</span>
          <span className="terminal-line-note">
            {TERMINAL.system} · {TERMINAL.node}
          </span>
        </p>
      </div>
      <aside className="terminal-notice">
        <p className="terminal-notice-label circa-label">{TERMINAL.notice.label}</p>
        <p className="terminal-notice-body">{TERMINAL.notice.body}</p>
        <p className="terminal-doctrine">{PROJECT.doctrine}</p>
        <p className="terminal-monitoring circa-mono">{TERMINAL.monitoring}</p>
      </aside>
    </div>
  );
}

function ClauseScene() {
  const scene = TERMINAL.scenes.clauses;
  return (
    <Scene id="clauses" index={scene.index} rail={scene.rail} heading={scene.heading} note={scene.note}>
      <ol className="clause-list">
        {TERMINAL.clauses.map((clause) => (
          <li className="clause" key={clause.index}>
            <p className="clause-index circa-mono">{clause.index}</p>
            <h3 className="clause-title">{clause.title}</h3>
            <p className="clause-body">{clause.body}</p>
          </li>
        ))}
      </ol>
    </Scene>
  );
}

function LedgerScene() {
  const scene = TERMINAL.scenes.ledger;
  return (
    <Scene id="ledger" index={scene.index} rail={scene.rail} heading={scene.heading} note={scene.note}>
      <div className="table-scroll">
        <table className="ledger" aria-label={TERMINAL.ledger.label}>
          <thead>
            <tr>
              <th scope="col">{TERMINAL.ledger.columns.code}</th>
              <th scope="col">{TERMINAL.ledger.columns.designation}</th>
              <th scope="col">{TERMINAL.ledger.columns.klass}</th>
              <th scope="col">{TERMINAL.ledger.columns.filed}</th>
              <th scope="col">{TERMINAL.ledger.columns.status}</th>
            </tr>
          </thead>
          <tbody>
            {FILINGS.map((filing) => (
              <tr key={filing.code}>
                <td className="ledger-code circa-mono">{filing.code}</td>
                <td className="ledger-designation">
                  {filing.designation ?? <span className="ledger-withheld">{TERMINAL.ledger.withheld}</span>}
                </td>
                <td className="ledger-class">{classLabel(filing)}</td>
                <td className="ledger-filed circa-mono">{filing.filed}</td>
                <td className="ledger-status" data-status={filing.status}>
                  {statusLabel(filing)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Scene>
  );
}

function FilingScene() {
  const scene = TERMINAL.scenes.filing;
  return (
    <Scene id="filing" index={scene.index} rail={scene.rail} heading={scene.heading} note={scene.note} className="scene-filing">
      <div className="filing-grid terminal-filing">
        <figure className="filing-sheet">
          <div className="filing-sheet-head">
            <span className="filing-code circa-mono">{SPECIMEN.code}</span>
            <span className="filing-tag" data-status={SPECIMEN.status}>
              {statusLabel(SPECIMEN)}
            </span>
            <span className="filing-tag">{classLabel(SPECIMEN)}</span>
          </div>
          <h3 className="filing-title">{SPECIMEN.designation}</h3>
          <p className="filing-meta circa-mono">
            Filed {SPECIMEN.filed} by {SPECIMEN.organization} at {SPECIMEN.clearance}
          </p>
          <p className="filing-abstract">{SPECIMEN.abstract}</p>
          <figcaption className="filing-foot">Entry rendered from Markdown</figcaption>
        </figure>
        <dl className="field-list">
          {TERMINAL.filing.fields.map((field) => (
            <div className="field-row" key={field.key}>
              <dt className="field-key">{field.key}</dt>
              <dd className="field-note">{field.note}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Scene>
  );
}

function OrganizationScene() {
  const scene = TERMINAL.scenes.organizations;
  return (
    <Scene id="organizations" index={scene.index} rail={scene.rail} heading={scene.heading} note={scene.note} className="scene-organizations">
      <div className="table-scroll">
        <table className="ledger ledger-bodies" aria-label={TERMINAL.organizations.label}>
          <thead>
            <tr>
              <th scope="col">{TERMINAL.organizations.columns.code}</th>
              <th scope="col">{TERMINAL.organizations.columns.designation}</th>
              <th scope="col">{TERMINAL.organizations.columns.filed}</th>
              <th scope="col">{TERMINAL.organizations.vocabularyLabel}</th>
              <th scope="col">{TERMINAL.organizations.columns.status}</th>
            </tr>
          </thead>
          <tbody>
            {ORGANIZATIONS.map((organization) => (
              <tr key={organization.code}>
                <td className="ledger-code circa-mono">{organization.code}</td>
                <td className="ledger-designation">
                  {organization.designation ?? <span className="ledger-withheld">{TERMINAL.ledger.withheld}</span>}
                </td>
                <td className="ledger-filed circa-mono">{organization.filed}</td>
                <td className="ledger-vocabulary">{TERMINAL.organizations.vocabulary[organization.code]}</td>
                <td className="ledger-status" data-status={organization.status}>
                  {statusLabel(organization)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Scene>
  );
}

function EntryBand() {
  return (
    <section className="terminal-entry" aria-labelledby="entry-title">
      <div className="site-frame">
        <div>
          <p className="entry-label circa-label">{TERMINAL.entry.label}</p>
          <h2 className="entry-title" id="entry-title">
            {TERMINAL.entry.heading}
          </h2>
          <p className="entry-note">{TERMINAL.entry.note}</p>
        </div>
        <div className="entry-action">
          <Link className="terminal-enter" href="/desktop">
            <span>{TERMINAL.entry.cta}</span>
            <span className="terminal-enter-path circa-mono">{TERMINAL.entry.path}</span>
          </Link>
          <p className="entry-cue circa-mono">
            {TERMINAL.system} · {TERMINAL.clearance}
          </p>
        </div>
      </div>
    </section>
  );
}

function Hinge() {
  return (
    <section className="hinge" aria-labelledby="hinge-label">
      <div className="site-frame">
        <p className="hinge-label circa-mono" id="hinge-label">
          {HINGE.label}
        </p>
        <p className="hinge-line">{HINGE.line}</p>
      </div>
    </section>
  );
}

function BriefLetterhead() {
  return (
    <>
      <header className="brief-letterhead">
        <div className="brief-identity">
          <p className="brief-owner">{PROJECT.name}</p>
          <h2 className="brief-title" id="brief-title">
            {BRIEF.title}
          </h2>
          <p className="brief-status circa-mono">
            {PROJECT.status} · {PROJECT.license} licensed · no release yet
          </p>
        </div>
        <nav className="brief-contents" aria-label={BRIEF.contentsLabel}>
          {TRACKS.map((track) => (
            <a className="brief-track" href={`#${track.id}`} key={track.id}>
              <span className="brief-track-index circa-mono">{track.index}</span>
              <span className="brief-track-name">{track.title}</span>
              <span className="brief-track-kicker">{track.kicker}</span>
            </a>
          ))}
        </nav>
      </header>
      <p className="brief-lead">{BRIEF.lead}</p>
    </>
  );
}

function TrackShell({ track, children }: { track: Track; children: React.ReactNode }) {
  return (
    <section className="track" id={track.id} aria-labelledby={`${track.id}-title`}>
      <p className="track-rail">
        <span className="track-index circa-mono" aria-hidden="true">
          {track.index}
        </span>
        <span className="track-kicker">{track.kicker}</span>
      </p>
      <div className="track-body">
        <h3 className="track-title" id={`${track.id}-title`}>
          {track.title}
        </h3>
        <p className="track-lead">{track.lead}</p>
        {children}
      </div>
    </section>
  );
}

function WritersTrack({ track }: { track: Track }) {
  return (
    <TrackShell track={track}>
      <ol className="filing-types">
        {WRITER_FILINGS.map((filing) => (
          <li className="filing-type" key={filing.id}>
            <p className="filing-type-code circa-mono">{filing.code}</p>
            <h4 className="filing-type-title">{filing.title}</h4>
            <p className="filing-type-note">{filing.note}</p>
          </li>
        ))}
      </ol>
      <div className="track-columns">
        <div>
          <p className="sub-label">What the canon holds</p>
          <ul className="rule-list">
            {WRITER_RULES.map((rule) => (
              <li className="rule" key={rule.id}>
                <p className="rule-title">{rule.title}</p>
                <p className="rule-note">{rule.note}</p>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="sub-label">How to start</p>
          <ol className="step-list">
            {WRITER_STEPS.map((step) => (
              <li className="step" key={step.index}>
                <span className="step-index circa-mono" aria-hidden="true">
                  {step.index}
                </span>
                <span className="step-copy">
                  <span className="rule-title">{step.title}</span>
                  <span className="rule-note">{step.note}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="track-landing">
            The setting and its canon live in <span className="circa-mono">docs/lore/</span> and in the context
            document. Records themselves are written at the workstation.
          </p>
        </div>
      </div>
    </TrackShell>
  );
}

function DevelopersTrack({ track }: { track: Track }) {
  return (
    <TrackShell track={track}>
      <div className="track-columns">
        <div>
          <p className="sub-label">{BRIEF.stackLabel}</p>
          <table className="stack" aria-label={BRIEF.stackLabel}>
            <thead>
              <tr>
                <th scope="col">Piece</th>
                <th scope="col">What it is</th>
                <th scope="col">State</th>
              </tr>
            </thead>
            <tbody>
              <tr data-state="shipped">
                <th scope="row">Status</th>
                <td className="stack-value">{PROJECT.status}</td>
                <td className="stack-state">Current</td>
              </tr>
              {STACK.map((row) => (
                <tr key={row.key} data-state={row.state}>
                  <th scope="row">{row.key}</th>
                  <td className="stack-value">{row.value}</td>
                  <td className="stack-state">{row.state === "planned" ? "Planned" : "Shipped"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <p className="sub-label">{BRIEF.layoutLabel}</p>
          <ul className="layout-list">
            {LAYOUT.map((row) => (
              <li className="layout-row" key={row.path}>
                <span className="layout-path circa-mono">{row.path}</span>
                <span className="layout-purpose">{row.purpose}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="builder-block">
        <p className="sub-label">{BRIEF.loopLabel}</p>
        <ol className="builder-list">
          {BUILDER_STEPS.map((step, position) => (
            <li className="builder-step" key={step.id}>
              <span className="builder-index circa-mono" aria-hidden="true">
                {String(position + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="rule-title">{step.title}</p>
                <p className="rule-note">{step.note}</p>
                {step.commands.map((id) => {
                  const command = commandById(id);
                  if (!command) return null;
                  return (
                    <p className="command-row" key={id}>
                      {command.cwd && <span className="command-cwd circa-mono">in {command.cwd}</span>}
                      <span className="command-text circa-mono">{command.text}</span>
                      <CopyCommand text={command.text} />
                      <span className="command-note">{command.note}</span>
                    </p>
                  );
                })}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </TrackShell>
  );
}

function Colophon() {
  return (
    <section className="colophon" aria-labelledby="colophon-title">
      <p className="sub-label" id="colophon-title">
        {BRIEF.documentsLabel}
      </p>
      <p className="colophon-note">
        No remote is configured yet, so these are paths in the checkout rather than links. Copy one and open it in your
        editor, or read it on the repository host once the project is published.
      </p>
      <ul className="document-list">
        {DOCUMENTS.map((document) => (
          <li className="document-row" key={document.id}>
            <span className="document-copy">
              <span className="document-path circa-mono">{document.path}</span>
              <span className="document-decides">{document.decides}</span>
            </span>
            <CopyCommand text={document.path} label={`Copy path ${document.path}`} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function Closing() {
  return (
    <footer className="closing">
      <div className="site-frame">
        <div className="closing-action">
          <p className="closing-label circa-label">The archive is the other half of this page</p>
          <Link className="closing-link" href="/desktop">
            <span>Open the workstation</span>
            <span className="closing-link-path circa-mono">/desktop</span>
          </Link>
        </div>
        <div className="closing-terms">
          <p className="closing-legal">
            {PROJECT.license} licensed code and documentation. Contributions are accepted under the terms in
            CONTRIBUTING.md, and the code of conduct applies to every conversation about the archive.
          </p>
          <p className="closing-terminal circa-mono">{TERMINAL.footer}</p>
        </div>
      </div>
    </footer>
  );
}

export function LandingPage() {
  const [writers, developers] = TRACKS;
  return (
    <div className="landing">
      <a className="landing-skip" href="#brief">
        Skip to the project brief
      </a>
      <section className="terminal" id="terminal" aria-labelledby="terminal-title">
        <div className="terminal-scanlines circa-scanlines" aria-hidden="true" />
        <div className="site-frame">
          <TerminalBar />
          <TerminalMasthead />
          <p className="terminal-cue">
            <a href="#clauses">{TERMINAL.cue}</a>
          </p>
        </div>
        <ClauseScene />
        <LedgerScene />
        <FilingScene />
        <OrganizationScene />
        <EntryBand />
      </section>
      <Hinge />
      <section className="brief" id="brief" aria-labelledby="brief-title">
        <div className="site-frame">
          <BriefLetterhead />
          <WritersTrack track={writers} />
          <DevelopersTrack track={developers} />
          <Colophon />
        </div>
      </section>
      <Closing />
    </div>
  );
}
