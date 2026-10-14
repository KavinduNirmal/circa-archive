import Link from "next/link";
import { CopyCommand } from "./copy-command";
import {
  COMMANDS,
  DOCUMENTS,
  FIGURES,
  LAYOUT,
  PROJECT,
  ROLES,
  SECTIONS,
  SPECIMEN,
  STACK,
  STEPS,
  commandById,
  type SiteSection,
} from "./site-meta";

/**
 * The public landing page.
 *
 * This is the one screen in the project that is not inside the fiction: it is
 * addressed to contributors, so it states the real status, the real stack, and
 * the real commands from the real manifests. It wears the CIRCA/OS chrome
 * anyway, because the workstation is what a contributor is being asked to help
 * build, and the docket is the honest front for it. Every fact it prints comes
 * from `site-meta.ts`, which the metadata test checks against the repository.
 */

/** The stock rules that keep the archive one machine instead of several. */
const STUDIO_RULES: readonly { title: string; note: string }[] = [
  { title: "Test first", note: "A behaviour change starts as a failing test, then passes, then gets tidied up." },
  { title: "One change per pull request", note: "A focused branch is reviewed faster and can be reverted on its own." },
  { title: "Document the folder", note: "Every authored folder carries a README, staged with the code that needs it." },
  { title: "Keep the vocabulary", note: "Incidents, records, organizations, continuities, and tombstones are the fixed terms." },
  { title: "Original work only", note: "Do not copy reference fiction, artwork, or assets into the archive." },
  { title: "Report what you verified", note: "Name the checks that ran, and name the ones that could not run." },
];

function Section({ section, children }: { section: SiteSection; children: React.ReactNode }) {
  return (
    <section className="landing-section" id={section.id} aria-labelledby={`${section.id}-title`}>
      <div className="landing-head">
        <span className="landing-index circa-mono" aria-hidden="true">
          {section.index}
        </span>
        <h2 className="landing-title" id={`${section.id}-title`}>
          {section.title}
        </h2>
        <p className="landing-standfirst">{section.standfirst}</p>
      </div>
      {children}
    </section>
  );
}

function Docket() {
  return (
    <section className="landing-docket" aria-labelledby="docket-title">
      <div className="landing-docket-copy">
        <p className="landing-overline circa-label">{PROJECT.commission}</p>
        <h1 className="landing-wordmark" id="docket-title">
          {PROJECT.name}
        </h1>
        <p className="landing-thesis">{PROJECT.thesis}</p>
        <div className="landing-actions">
          {/* The only filled control on the page: it is the way into the machine. */}
          <Link className="landing-enter" href="/desktop">
            <span>Enter workstation</span>
            <span className="landing-enter-path circa-mono">/desktop</span>
          </Link>
          <a className="landing-secondary" href="#documents">
            Read the documents
          </a>
        </div>
        <blockquote className="landing-doctrine">
          <p>{PROJECT.doctrine}</p>
          <cite>CIRCA/OS manual, section 1.1</cite>
        </blockquote>
      </div>
      <aside className="landing-plate circa-raised" aria-labelledby="docket-plate-title">
        <div className="landing-plate-head">
          <h2 className="landing-plate-title" id="docket-plate-title">
            Public docket
          </h2>
          <span className="landing-plate-code circa-mono">04.12</span>
        </div>
        <dl className="landing-figures">
          {FIGURES.map((figure) => (
            <div key={figure.key} className="landing-figure">
              <dt className="circa-label">{figure.key}</dt>
              <dd className="circa-mono">{figure.value}</dd>
            </div>
          ))}
        </dl>
        <p className="landing-stamp">{PROJECT.status}</p>
        <p className="landing-plate-note">{PROJECT.summary}</p>
      </aside>
    </section>
  );
}

function CommunitySection() {
  return (
    <Section section={SECTIONS[0]}>
      <div className="landing-lede">
        <p>
          The archive is kept by people who write records and people who build the machine that holds them. Both
          halves ship in the same repository, and neither is finished.
        </p>
        <p>
          There is no account to create and no editor to petition. Organization dossiers are entities rather than
          users, votes are advisory signals rather than decisions, and the only authority that rejects a filing is
          coherence review. Documentation is reviewed like code, so a decision that is not written down is still an
          open question.
        </p>
      </div>
      <ul className="landing-roles">
        {ROLES.map((role) => (
          <li key={role.id} className="landing-role circa-sunken">
            <span className="landing-role-index circa-mono" aria-hidden="true">
              {role.index}
            </span>
            <h3 className="landing-role-title">{role.title}</h3>
            <p className="landing-role-discipline circa-label">{role.discipline}</p>
            <p className="landing-role-work">{role.work}</p>
            <p className="landing-role-path circa-mono">{role.path}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function RecordSection() {
  return (
    <Section section={SECTIONS[1]}>
      <div className="landing-record">
        <div className="landing-record-copy">
          <p>
            A record is a found document: an incident nobody can explain, a dossier on an organization that files the
            paranormal in its own language, or the continuation of somebody else&apos;s story. Write it in Markdown and
            it is rendered as paper inside the workstation.
          </p>
          <p>
            The archive has no opinion about whether any of it happened. It files what it is given, keeps every code
            resolvable, and never rewrites history when an organization is erased. A rejected organization loses its
            code and keeps its records, which stay readable as rumors.
          </p>
          <dl className="landing-notes">
            <div className="landing-note">
              <dt className="circa-label">Filed as</dt>
              <dd>Its own code, for example INC-00042, issued once and never reused.</dd>
            </div>
            <div className="landing-note">
              <dt className="circa-label">Read as</dt>
              <dd>Paper. Markdown rendered in the workstation, never a file to download.</dd>
            </div>
            <div className="landing-note">
              <dt className="circa-label">Cleared by</dt>
              <dd>A level, from LEVEL 3 to LEVEL 5. Some designations stay withheld and stay listed.</dd>
            </div>
            <div className="landing-note">
              <dt className="circa-label">Erased</dt>
              <dd>Still browsable. Nothing is deleted from the archive, including the things it denies.</dd>
            </div>
          </dl>
        </div>
        <figure className="landing-specimen">
          <figcaption className="circa-label">Specimen, as the archive browser files it</figcaption>
          <div className="landing-specimen-sheet">
            <div className="landing-specimen-head">
              <span className="landing-specimen-code circa-mono">{SPECIMEN.code}</span>
              <span className="landing-specimen-tag circa-label" data-status={SPECIMEN.status}>
                {SPECIMEN.statusLabel}
              </span>
              <span className="landing-specimen-tag circa-label">{SPECIMEN.classLabel}</span>
            </div>
            <h3 className="landing-specimen-title">{SPECIMEN.designation}</h3>
            <p className="landing-specimen-meta circa-mono">
              Filed {SPECIMEN.filed} by {SPECIMEN.organization} at {SPECIMEN.clearance}
            </p>
            <p className="landing-specimen-abstract">{SPECIMEN.abstract}</p>
            <p className="landing-specimen-foot circa-label">Rendered from Markdown</p>
          </div>
        </figure>
      </div>
    </Section>
  );
}

function ProjectSection() {
  const dev = commandById("dev");
  return (
    <Section section={SECTIONS[2]}>
      <div className="landing-project">
        <div className="landing-project-table">
          <table className="landing-table" aria-label="Project record">
            <caption className="circa-label">Interface, services, and data, as they stand today</caption>
            <thead>
              <tr>
                <th scope="col">Detail</th>
                <th scope="col">Value</th>
                <th scope="col">State</th>
              </tr>
            </thead>
            <tbody>
              <tr className="landing-table-lead">
                <th scope="row">Status</th>
                <td>
                  <span className="landing-value">{PROJECT.status}</span>
                </td>
                <td>
                  <span className="landing-state" data-state="shipped">
                    Current
                  </span>
                </td>
              </tr>
              {STACK.map((row) => (
                <tr key={row.key}>
                  <th scope="row">{row.key}</th>
                  <td>
                    <span className="landing-value">{row.value}</span>
                  </td>
                  <td>
                    <span className="landing-state" data-state={row.state}>
                      {row.state === "planned" ? "Planned" : "Shipped"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {dev && (
            <div className="landing-serve circa-sunken">
              <p className="landing-serve-note">
                The workstation runs on port 3001. The backend is not implemented, so every screen reads from its own
                index instead of a service.
              </p>
              <p className="landing-command">
                <span className="landing-command-text circa-mono">{dev.text}</span>
                <CopyCommand text={dev.text} />
              </p>
            </div>
          )}
        </div>
        <div className="landing-layout">
          <h3 className="landing-subtitle">Repository layout</h3>
          <ul className="landing-tree">
            {LAYOUT.map((row) => (
              <li key={row.path} className="landing-tree-row">
                <span className="landing-tree-path circa-mono">{row.path}</span>
                <span className="landing-tree-purpose">{row.purpose}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}

function ContributeSection() {
  return (
    <Section section={SECTIONS[3]}>
      <div className="landing-contribute">
        <ol className="landing-steps">
          {STEPS.map((step) => (
            <li key={step.id} className="landing-step">
              <span className="landing-step-index circa-mono" aria-hidden="true">
                {step.index}
              </span>
              <div className="landing-step-body">
                <h3 className="landing-step-title">{step.title}</h3>
                <p className="landing-step-note">{step.body}</p>
                {step.commands.length > 0 && (
                  <ul className="landing-commands">
                    {step.commands.map((id) => {
                      const command = commandById(id);
                      if (!command) return null;
                      return (
                        <li key={id} className="landing-command">
                          {command.cwd && <span className="landing-command-cwd circa-mono">{command.cwd}</span>}
                          <span className="landing-command-text circa-mono">{command.text}</span>
                          <CopyCommand text={command.text} />
                          <span className="landing-command-note">{command.note}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ol>
        <aside className="landing-rules circa-raised" aria-labelledby="landing-rules-title">
          <h3 className="landing-subtitle" id="landing-rules-title">
            Studio rules
          </h3>
          <ul className="landing-rule-list">
            {STUDIO_RULES.map((rule) => (
              <li key={rule.title} className="landing-rule">
                <span className="landing-rule-title">{rule.title}</span>
                <span className="landing-rule-note">{rule.note}</span>
              </li>
            ))}
          </ul>
          <p className="landing-rules-foot">
            {COMMANDS.length} documented commands, and every one of them is defined in a manifest rather than in this
            page.
          </p>
        </aside>
      </div>
    </Section>
  );
}

function DocumentsSection() {
  return (
    <Section section={SECTIONS[4]}>
      <p className="landing-lede-note">
        No remote is configured yet, so these are paths in the checkout rather than links. Copy one and open it in your
        editor, or read it on the repository host once the project is published.
      </p>
      <ul className="landing-documents">
        {DOCUMENTS.map((document) => (
          <li key={document.id} className="landing-document">
            <span className="landing-document-path circa-mono">{document.path}</span>
            <span className="landing-document-decides">{document.decides}</span>
            <CopyCommand text={document.path} label={`Copy path ${document.path}`} />
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function LandingPage() {
  return (
    <div className="landing">
      <div className="landing-scanlines circa-scanlines" aria-hidden="true" />
      <a className="landing-skip" href="#main">
        Skip to content
      </a>
      <header className="landing-bar">
        <div className="landing-bar-inner">
          <span className="landing-sys">
            <span className="landing-sys-mark" aria-hidden="true">
              ▦
            </span>
            <span className="landing-sys-name">{PROJECT.system}</span>
            <span className="landing-sys-note circa-label">{PROJECT.terminal}</span>
          </span>
          <nav className="landing-nav" aria-label="Site sections">
            {SECTIONS.map((section) => (
              <a key={section.id} href={`#${section.id}`}>
                {section.nav}
              </a>
            ))}
          </nav>
          <span className="landing-bar-status circa-label">{PROJECT.status}</span>
        </div>
      </header>
      <main className="landing-main" id="main">
        <Docket />
        <ul className="landing-ledger" aria-label="Shipped stack">
          {STACK.filter((row) => row.state === "shipped").map((row) => (
            <li key={row.key} className="landing-ledger-row">
              <span className="landing-ledger-key circa-label">{row.key}</span>
              <span className="landing-ledger-value circa-mono">{row.value}</span>
            </li>
          ))}
        </ul>
        <CommunitySection />
        <RecordSection />
        <ProjectSection />
        <ContributeSection />
        <DocumentsSection />
      </main>
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-mark">
            <p className="landing-footer-name">{PROJECT.name}</p>
            <p className="landing-footer-commission">{PROJECT.commission}</p>
          </div>
          <nav className="landing-footer-nav" aria-label="Documents and sections">
            {SECTIONS.map((section) => (
              <a key={section.id} href={`#${section.id}`}>
                {section.title}
              </a>
            ))}
          </nav>
          <p className="landing-footer-legal">
            {PROJECT.license} licensed code and documentation. Contributions are accepted under the terms in
            CONTRIBUTING.md, and the code of conduct applies to every conversation about the archive.
          </p>
        </div>
      </footer>
    </div>
  );
}
