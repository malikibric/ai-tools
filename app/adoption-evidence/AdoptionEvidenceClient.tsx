"use client";

import { useState } from "react";
import { Card } from "@/lib/ui/Card";
import { AdoptionPill } from "@/lib/ui/AdoptionPill";
import {
  computeAdoptionMetrics,
  summarizeAdoption,
  type AdoptionMetrics,
  type AdoptionSummary,
  type AdoptionWorkflow,
  type AdoptionLevel,
} from "@/lib/store/adoption-workflows";

const LEVELS: { key: AdoptionLevel; label: string }[] = [
  { key: "strong", label: "Strong" },
  { key: "slipping", label: "Slipping" },
  { key: "at_risk", label: "At Risk" },
  { key: "stalled", label: "Stalled" },
];

const LEVEL_BAR_COLORS: Record<AdoptionLevel, string> = {
  strong: "bg-healthy",
  slipping: "bg-at-risk",
  at_risk: "bg-broken",
  stalled: "bg-text-muted/40",
};

const MAX_BAR_RUNS = 5;

function daysAgoLabel(iso: string | null): string {
  if (!iso) return "Never";
  const days = Math.floor((Date.now() - Date.parse(iso)) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function hoursLabel(minutes: number): string {
  return minutes >= 60 ? `${Math.round((minutes / 60) * 10) / 10}h` : `${minutes}m`;
}

function ScoreBar({ score, level }: { score: number; level: AdoptionLevel }) {
  return (
    <div className="mt-2 h-1.5 w-full overflow-hidden rounded bg-border">
      <div className={`h-full ${LEVEL_BAR_COLORS[level]}`} style={{ width: `${score}%` }} />
    </div>
  );
}

function Sparkline({ weeklyRuns }: { weeklyRuns: number[] }) {
  return (
    <div className="mt-2 flex h-8 items-end gap-0.5">
      {weeklyRuns.map((runs, index) => (
        <div
          key={index}
          className="flex-1 rounded-sm bg-amber/70"
          style={{ height: `${Math.min(runs, MAX_BAR_RUNS) * 7}px` }}
        />
      ))}
    </div>
  );
}

export function AdoptionEvidenceClient({
  initialWorkflows,
  initialSummary,
}: {
  initialWorkflows: AdoptionWorkflow[];
  initialSummary: AdoptionSummary;
}) {
  const [workflows, setWorkflows] = useState(initialWorkflows);
  const [summary, setSummary] = useState(initialSummary);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [heartbeatId, setHeartbeatId] = useState<string | null>(null);
  const [errorByWorkflow, setErrorByWorkflow] = useState<Record<string, string>>({});

  const selected = workflows.find((w) => w.id === selectedId) ?? null;
  const selectedMetrics: AdoptionMetrics | null = selected ? computeAdoptionMetrics(selected) : null;

  function applyWorkflow(updated: AdoptionWorkflow) {
    setWorkflows((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
    setSummary(summarizeAdoption(workflows.map((w) => (w.id === updated.id ? updated : w))));
    setSelectedId(updated.id);
  }

  async function runAnalysis(id: string) {
    setLoadingId(id);
    setErrorByWorkflow((prev) => ({ ...prev, [id]: "" }));
    try {
      const response = await fetch("/api/adoption-evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflowId: id }),
      });
      const data = await response.json();
      if (!response.ok) {
        setErrorByWorkflow((prev) => ({ ...prev, [id]: data.error?.message ?? "Analysis failed." }));
        return;
      }
      applyWorkflow(data.workflow);
    } finally {
      setLoadingId(null);
    }
  }

  async function simulateRun(id: string) {
    setHeartbeatId(id);
    setErrorByWorkflow((prev) => ({ ...prev, [id]: "" }));
    try {
      const response = await fetch("/api/adoption-evidence/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflowId: id }),
      });
      const data = await response.json();
      if (!response.ok) {
        setErrorByWorkflow((prev) => ({ ...prev, [id]: data.error?.message ?? "Heartbeat failed." }));
        return;
      }
      applyWorkflow(data.workflow);
    } finally {
      setHeartbeatId(null);
    }
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <p className="font-mono text-xs uppercase tracking-wide text-text-muted">Workflows tracked</p>
          <p className="mt-1 font-display text-2xl font-semibold text-text">{summary.workflowCount}</p>
        </Card>
        <Card>
          <p className="font-mono text-xs uppercase tracking-wide text-text-muted">Strong adoption</p>
          <p className="mt-1 font-display text-2xl font-semibold text-healthy">
            {summary.strongCount}/{summary.workflowCount}
          </p>
        </Card>
        <Card>
          <p className="font-mono text-xs uppercase tracking-wide text-text-muted">Avg behavior-change score</p>
          <p className="mt-1 font-display text-2xl font-semibold text-text">{summary.avgScore}/100</p>
        </Card>
        <Card>
          <p className="font-mono text-xs uppercase tracking-wide text-text-muted">Time saved (claimed vs measured)</p>
          <p className="mt-1 font-display text-2xl font-semibold text-text">
            {hoursLabel(summary.measuredMinutesPerWeek)}
            <span className="text-base text-text-muted"> / {hoursLabel(summary.claimedMinutesPerWeek)}</span>
          </p>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="grid gap-4 sm:grid-cols-2">
          {LEVELS.map((level) => (
            <div key={level.key}>
              <h2 className="font-mono text-xs uppercase tracking-wide text-text-muted">{level.label}</h2>
              <div className="mt-3 space-y-3">
                {workflows
                  .filter((w) => computeAdoptionMetrics(w).level === level.key)
                  .map((workflow) => {
                    const metrics = computeAdoptionMetrics(workflow);
                    return (
                      <Card key={workflow.id} className={selectedId === workflow.id ? "border-amber" : ""}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(workflow.id)}
                          className="w-full text-left"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-display text-sm font-semibold text-text">{workflow.name}</h3>
                            <AdoptionPill level={metrics.level} />
                          </div>
                          <p className="mt-1 text-xs text-text-muted">
                            Owner: {workflow.owner} · Score {metrics.score}/100
                          </p>
                          <ScoreBar score={metrics.score} level={metrics.level} />
                          <p className="mt-1 text-xs text-text-muted">
                            Claimed {workflow.claimedRunsPerWeek} runs/wk · actual {metrics.recentAvgRuns} · last
                            run {daysAgoLabel(workflow.lastRunAt)}
                          </p>
                          <Sparkline weeklyRuns={workflow.weeklyRuns} />
                        </button>
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => runAnalysis(workflow.id)}
                            disabled={loadingId === workflow.id}
                            className="rounded border border-amber px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-amber hover:bg-amber-soft disabled:opacity-50"
                          >
                            {loadingId === workflow.id ? "Analyzing..." : "Run Adoption Analysis"}
                          </button>
                          <button
                            type="button"
                            onClick={() => simulateRun(workflow.id)}
                            disabled={heartbeatId === workflow.id}
                            className="rounded border border-border px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-text-muted hover:text-text disabled:opacity-50"
                          >
                            {heartbeatId === workflow.id ? "Pinging..." : "Simulate run"}
                          </button>
                        </div>
                        {errorByWorkflow[workflow.id] && (
                          <p className="mt-2 text-xs text-broken">{errorByWorkflow[workflow.id]}</p>
                        )}
                      </Card>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>

        <Card>
          {!selected && <p className="text-sm text-text-muted">Select a workflow to see its detail.</p>}
          {selected && selectedMetrics && (
            <div>
              <h3 className="font-display text-base font-semibold text-text">{selected.name}</h3>
              <p className="mt-2 text-sm text-text-muted">{selected.description}</p>
              <p className="mt-3 font-mono text-xs uppercase tracking-wide text-text-muted">Score breakdown</p>
              <ul className="mt-1 space-y-1 text-sm text-text-muted">
                <li>Adherence (0-50): {selectedMetrics.adherencePoints}</li>
                <li>Trend (0-30): {selectedMetrics.trendPoints}</li>
                <li>Recency (0-20): {selectedMetrics.recencyPoints}</li>
              </ul>
              <p className="mt-3 text-sm text-text-muted">
                Last run: <span className="text-text">{daysAgoLabel(selected.lastRunAt)}</span>
              </p>
              {selected.assessment && (
                <div className="mt-4 space-y-2 border-t border-border pt-4">
                  <p className="text-sm text-text">
                    <span className="text-text-muted">Diagnosis: </span>
                    {selected.assessment.diagnosis}
                  </p>
                  <p className="text-sm text-text">
                    <span className="text-text-muted">Suggested intervention: </span>
                    {selected.assessment.suggestedIntervention}
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      <p className="mt-6 max-w-3xl text-xs text-text-muted">
        {summary.stalledCount} workflow{summary.stalledCount === 1 ? "" : "s"} approved but no longer run at all —
        the kind of adoption-theater signal an executive would want to know about before renewal.
      </p>
    </div>
  );
}
