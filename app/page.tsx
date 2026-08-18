import Link from "next/link";
import { Card } from "@/lib/ui/Card";

const TOOLS = [
  {
    href: "/adoption-evidence",
    name: "Adoption Evidence Engine",
    description: "Measures whether approved workflows actually changed the work — and proves it with telemetry.",
  },
  {
    href: "/drift-monitor",
    name: "Workflow Drift Monitor",
    description: "Flags approved workflows whose dependencies or behavior have likely drifted since approval.",
  },
  {
    href: "/review-copilot",
    name: "Manager Review Copilot",
    description: "Turns a raw employee workflow submission into a structured brief a manager can act on.",
  },
  {
    href: "/shadow-scanner",
    name: "Shadow AI Discovery Scanner",
    description: "Surveys informal AI usage and aggregates it into a rollout-planning artifact.",
  },
];

const LOOP = [
  { stage: "Diagnose", note: "Shadow AI Discovery Scanner finds what's already happening." },
  { stage: "Pathway & Tutor", note: "TAI Labs personalizes learning and coaches each person with AI." },
  { stage: "Build", note: "Employees assemble their own workflows from approved building blocks." },
  { stage: "Approve", note: "Manager Review Copilot turns a submission into a real go / no-go decision." },
  { stage: "Measure", note: "Adoption Evidence Engine proves behavior change; Drift Monitor keeps it honest." },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
      {/* Hero */}
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber">TAI Labs · Product / GTM Take-home</p>
      <h1 className="mt-5 max-w-3xl font-display text-4xl font-semibold leading-[1.04] tracking-tight text-text sm:text-6xl">
        Four tools that turn AI adoption from a promise into{" "}
        <em className="italic text-amber">proof</em>.
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-text-muted">
        Diagnose, teach, build, approve, measure. Each prototype plugs a gap in the TAI Labs product loop — and
        ships with real AI judgment layered on top of deterministic, auditable scoring.
      </p>

      <hr className="mt-14 border-border" />

      {/* The TAI Labs loop */}
      <section className="mt-12">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber">The product loop</p>
        <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-text sm:text-3xl">
          What TAI Labs is building
        </h2>
        <p className="mt-3 max-w-2xl leading-relaxed text-text-muted">
          TAI Labs helps enterprises deploy AI agents their people actually trust and use. The loop is easy to say
          and hard to do. These four tools strengthen the parts of it that break first.
        </p>
        <ol className="mt-8 space-y-3">
          {LOOP.map((step, i) => (
            <li key={step.stage} className="flex gap-4 border-b border-border/70 pb-3 last:border-b-0">
              <span className="font-mono text-xs uppercase tracking-wide text-text-muted">
                0{i + 1}
              </span>
              <div>
                <p className="font-display text-base font-semibold text-text">{step.stage}</p>
                <p className="text-sm leading-relaxed text-text-muted">{step.note}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <hr className="mt-14 border-border" />

      {/* The four tools */}
      <section className="mt-12">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber">The suite</p>
        <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-text sm:text-3xl">
          Four prototypes, one coherent product
        </h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {TOOLS.map((tool, index) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="animate-fade-up"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <Card className="group h-full transition-transform duration-200 hover:-translate-y-1 hover:border-amber">
                <p className="font-mono text-xs uppercase tracking-wide text-text-muted">
                  0{index + 1} / {String(TOOLS.length).padStart(2, "0")}
                </p>
                <h3 className="mt-3 font-display text-lg font-semibold tracking-tight text-text">{tool.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">{tool.description}</p>
                <p className="mt-4 font-mono text-xs uppercase tracking-wide text-amber opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  Open &rarr;
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <hr className="mt-14 border-border" />

      {/* About the builder */}
      <section className="mt-12">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber">About</p>
        <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-text sm:text-3xl">
          Built by Malik Ibric
        </h2>
        <Card className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-amber font-display text-2xl font-semibold text-amber">
            MI
          </div>
          <div className="flex-1">
            <p className="font-display text-xl font-semibold text-text">Malik Ibric</p>
            <p className="font-mono text-xs uppercase tracking-wide text-text-muted">Product / GTM Engineer</p>
            {/* TODO: replace placeholder bio with your real details. */}
            <p className="mt-3 max-w-xl leading-relaxed text-text-muted">
              Building at the edge of AI and go-to-market. This suite was assembled as a product take-home for TAI
              Labs — four working prototypes that show where the product loop leaks and how to close it.
            </p>
            <a
              href="https://www.linkedin.com/in/malikibric"
              className="mt-4 inline-flex items-center gap-2 rounded border border-border px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-text-muted transition-colors hover:border-amber hover:text-amber"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path d="M4.98 3.5A2.5 2.5 0 1 1 0 3.5a2.5 2.5 0 0 1 4.98 0zM.2 8.2h4.56V24H.2zM8.34 8.2h4.37v2.15h.06c.61-1.15 2.1-2.36 4.32-2.36 4.62 0 5.47 3.04 5.47 6.99V24h-4.56v-6.96c0-1.66-.03-3.8-2.31-3.8-2.32 0-2.67 1.81-2.67 3.68V24H8.34z" />
              </svg>
              LinkedIn
            </a>
          </div>
        </Card>
      </section>
    </div>
  );
}
