import Link from "next/link";
import { Card } from "@/lib/ui/Card";

const TOOLS = [
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

export default function HomePage() {
  return (
    <div className="mx-auto min-h-screen max-w-5xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-wide text-amber">TAI Labs Prototype Suite</p>
      <h1 className="mt-3 font-display text-4xl font-semibold text-text">Three tools for the enablement loop.</h1>
      <p className="mt-3 max-w-2xl text-text-muted">
        Diagnose, teach, build, approve, measure — these three prototypes plug the gaps between shipping a workflow
        and knowing it still works.
      </p>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((tool) => (
          <Link key={tool.href} href={tool.href}>
            <Card className="h-full transition hover:border-amber">
              <h2 className="font-display text-lg font-semibold text-text">{tool.name}</h2>
              <p className="mt-2 text-sm text-text-muted">{tool.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
