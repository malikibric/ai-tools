import type { Metadata } from "next";
import { PageShell } from "@/lib/ui/PageShell";
import { Card } from "@/lib/ui/Card";
import { getSurveyResponses, type SurveyResponse } from "@/lib/tools/shadow-scanner/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shadow AI Discovery — Aggregate — TAI Suite",
  description: "Ranked tools, use cases, and risk flags across all analyzed survey responses.",
};

function countBy(values: string[]): { label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

type AnalyzedResponse = SurveyResponse & { analysis: NonNullable<SurveyResponse["analysis"]> };

function hasAnalysis(response: SurveyResponse): response is AnalyzedResponse {
  return response.analysis !== null;
}

export default function AggregatePage() {
  const responses = getSurveyResponses().filter(hasAnalysis);

  const tools = countBy(responses.flatMap((r) => r.analysis.toolsMentioned));
  const useCases = countBy(responses.map((r) => r.analysis.useCaseCategory));
  const riskFlags = countBy(
    responses.map((r) => r.analysis.riskFlag).filter((flag): flag is string => flag !== null)
  );

  return (
    <PageShell
      title="Shadow AI Discovery — Aggregate Results"
      description={`Based on ${responses.length} analyzed survey responses.`}
    >
      <div className="grid gap-6 sm:grid-cols-3">
        <Card>
          <h2 className="font-display text-sm font-semibold text-text">Most common tools</h2>
          <ul className="mt-3 space-y-2 text-sm text-text-muted">
            {tools.map((tool) => (
              <li key={tool.label} className="flex justify-between">
                <span>{tool.label}</span>
                <span className="font-mono text-text">{tool.count}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="font-display text-sm font-semibold text-text">Most common use cases</h2>
          <ul className="mt-3 space-y-2 text-sm text-text-muted">
            {useCases.map((useCase) => (
              <li key={useCase.label} className="flex justify-between">
                <span>{useCase.label}</span>
                <span className="font-mono text-text">{useCase.count}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="font-display text-sm font-semibold text-broken">Risk flags (ranked)</h2>
          <ul className="mt-3 space-y-2 text-sm text-text-muted">
            {riskFlags.length === 0 && <li>None reported.</li>}
            {riskFlags.map((flag) => (
              <li key={flag.label} className="flex justify-between gap-3">
                <span>{flag.label}</span>
                <span className="font-mono text-text">{flag.count}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </PageShell>
  );
}
