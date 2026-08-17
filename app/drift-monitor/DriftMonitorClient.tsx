"use client";

import { useState } from "react";
import { Card } from "@/lib/ui/Card";
import { RiskPill } from "@/lib/ui/RiskPill";
import type { Workflow } from "@/lib/store/workflows";

const COLUMNS: { key: "unchecked" | "healthy" | "at_risk" | "broken"; label: string }[] = [
  { key: "unchecked", label: "Not Yet Checked" },
  { key: "healthy", label: "Healthy" },
  { key: "at_risk", label: "At Risk" },
  { key: "broken", label: "Broken" },
];

function columnFor(workflow: Workflow) {
  return workflow.assessment?.riskLevel ?? "unchecked";
}

export function DriftMonitorClient({ initialWorkflows }: { initialWorkflows: Workflow[] }) {
  const [workflows, setWorkflows] = useState(initialWorkflows);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [errorByWorkflow, setErrorByWorkflow] = useState<Record<string, string>>({});

  const selected = workflows.find((w) => w.id === selectedId) ?? null;

  async function runHealthCheck(id: string) {
    setLoadingId(id);
    setErrorByWorkflow((prev) => ({ ...prev, [id]: "" }));
    try {
      const response = await fetch("/api/drift-monitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflowId: id }),
      });
      const data = await response.json();
      if (!response.ok) {
        setErrorByWorkflow((prev) => ({ ...prev, [id]: data.error?.message ?? "Health check failed." }));
        return;
      }
      setWorkflows((prev) => prev.map((w) => (w.id === id ? data.workflow : w)));
      setSelectedId(id);
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="grid gap-4 sm:grid-cols-2">
        {COLUMNS.map((column) => (
          <div key={column.key}>
            <h2 className="font-mono text-xs uppercase tracking-wide text-text-muted">{column.label}</h2>
            <div className="mt-3 space-y-3">
              {workflows
                .filter((w) => columnFor(w) === column.key)
                .map((workflow) => (
                  <Card key={workflow.id} className={selectedId === workflow.id ? "border-amber" : ""}>
                    <button type="button" onClick={() => setSelectedId(workflow.id)} className="w-full text-left">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-display text-sm font-semibold text-text">{workflow.name}</h3>
                        {workflow.assessment && <RiskPill level={workflow.assessment.riskLevel} />}
                      </div>
                      <p className="mt-1 text-xs text-text-muted">Owner: {workflow.owner}</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => runHealthCheck(workflow.id)}
                      disabled={loadingId === workflow.id}
                      className="mt-3 rounded border border-amber px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-amber hover:bg-amber-soft disabled:opacity-50"
                    >
                      {loadingId === workflow.id ? "Checking..." : "Run Health Check"}
                    </button>
                    {errorByWorkflow[workflow.id] && (
                      <p className="mt-2 text-xs text-broken">{errorByWorkflow[workflow.id]}</p>
                    )}
                  </Card>
                ))}
            </div>
          </div>
        ))}
      </div>

      <Card>
        {!selected && <p className="text-sm text-text-muted">Select a workflow to see its detail.</p>}
        {selected && (
          <div>
            <h3 className="font-display text-base font-semibold text-text">{selected.name}</h3>
            <p className="mt-2 text-sm text-text-muted">{selected.description}</p>
            <p className="mt-3 font-mono text-xs uppercase tracking-wide text-text-muted">Dependencies</p>
            <ul className="mt-1 list-inside list-disc text-sm text-text-muted">
              {selected.dependencies.map((dependency) => (
                <li key={dependency}>{dependency}</li>
              ))}
            </ul>
            {selected.assessment && (
              <div className="mt-4 space-y-2 border-t border-border pt-4">
                <RiskPill level={selected.assessment.riskLevel} />
                <p className="text-sm text-text">
                  <span className="text-text-muted">Dependency change likelihood: </span>
                  {selected.assessment.dependencyChangeLikelihood}
                </p>
                <p className="text-sm text-text">
                  <span className="text-text-muted">Description consistency: </span>
                  {selected.assessment.descriptionConsistency}
                </p>
                <p className="text-sm text-text">
                  <span className="text-text-muted">Suggested next action: </span>
                  {selected.assessment.suggestedNextAction}
                </p>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
