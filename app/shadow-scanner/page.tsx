import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/lib/ui/PageShell";
import { SurveyForm } from "./SurveyForm";

export const metadata: Metadata = {
  title: "Shadow AI Discovery Scanner — TAI Suite",
  description: "Surveys informal AI usage and aggregates it into a rollout-planning artifact.",
};

export default function ShadowScannerPage() {
  return (
    <PageShell
      title="Shadow AI Discovery Scanner"
      description="A short survey about AI tools employees are already using informally, before any training program starts."
    >
      <div className="mb-4">
        <Link
          href="/shadow-scanner/aggregate"
          className="font-mono text-xs uppercase tracking-wide text-text-muted hover:text-amber"
        >
          View aggregate results &rarr;
        </Link>
      </div>
      <SurveyForm />
    </PageShell>
  );
}
