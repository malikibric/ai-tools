"use client";

import { useState } from "react";
import { Card } from "@/lib/ui/Card";
import { Btn } from "@/lib/ui/Btn";
import { RiskPill } from "./RiskPill";
import type { Workflow } from "@/lib/tools/drift-monitor/store";

const COLUMNS: { key: "unchecked" | "healthy" | "at_risk" | "broken"; label: string }[] = [
  { key: "unchecked", label: "Not Yet Checked" },
  { key: "healthy", label: "Healthy" },
  { key: "at_risk", label: "At Risk" },
  { key: "broken", label: "Broken" },
];

function columnFor(workflow: Workflow) {
  return workflow.assessment?.riskLevel ?? "unchecked";
}

const EMPTY_FORM = {
  name: "",
  owner: "",
  description: "",
  dependencies: "",
  dateApproved: "",
  lastVerified: "",
};

export function DriftMonitorClient({ initialWorkflows }: { initialWorkflows: Workflow[] }) {
  const [workflows, setWorkflows] = useState(initialWorkflows);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [errorByWorkflow, setErrorByWorkflow] = useState<Record<string, string>>({});

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Workflow | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const selected = workflows.find((w) => w.id === selectedId) ?? null;

  async function refresh() {
    const res = await fetch("/api/drift-monitor");
    if (res.ok) {
      const data = await res.json();
      setWorkflows(data.workflows);
    }
  }

  async function runHealthCheck(id: string) {
    setLoadingId(id);
    setErrorByWorkflow((prev) => ({ ...prev, [id]: "" }));
    try {
      const response = await fetch("/api/drift-monitor/check", {
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

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(workflow: Workflow) {
    setEditing(workflow);
    setForm({
      name: workflow.name,
      owner: workflow.owner,
      description: workflow.description,
      dependencies: workflow.dependencies.join(", "),
      dateApproved: workflow.dateApproved,
      lastVerified: workflow.lastVerified,
    });
    setFormOpen(true);
  }

  async function saveForm(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    const payload = {
      name: form.name,
      owner: form.owner,
      description: form.description,
      dependencies: form.dependencies
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      dateApproved: form.dateApproved,
      lastVerified: form.lastVerified,
    };
    const url = editing ? `/api/drift-monitor/${editing.id}` : "/api/drift-monitor";
    const response = await fetch(url, {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      setFormError((await response.json()).error?.message ?? "Save failed.");
      setSaving(false);
      return;
    }
    setFormOpen(false);
    setSaving(false);
    await refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this workflow?")) return;
    const response = await fetch(`/api/drift-monitor/${id}`, { method: "DELETE" });
    if (response.ok) {
      await refresh();
      if (selectedId === id) setSelectedId(null);
    }
  }

  return (
    <div>
      <div className="flex justify-end">
        <Btn type="button" onClick={openNew}>
          + New workflow
        </Btn>
      </div>

      {formOpen && (
        <Card className="mt-4">
          <h2 className="font-display text-base font-semibold text-text">
            {editing ? "Edit workflow" : "New workflow"}
          </h2>
          <form onSubmit={saveForm} className="mt-4 space-y-3">
            <input
              required
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text"
            />
            <input
              required
              placeholder="Owner"
              value={form.owner}
              onChange={(e) => setForm({ ...form, owner: e.target.value })}
              className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text"
            />
            <textarea
              required
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text"
              rows={3}
            />
            <textarea
              required
              placeholder="Dependencies (comma separated)"
              value={form.dependencies}
              onChange={(e) => setForm({ ...form, dependencies: e.target.value })}
              className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text"
              rows={2}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                required
                placeholder="Date approved (YYYY-MM-DD)"
                value={form.dateApproved}
                onChange={(e) => setForm({ ...form, dateApproved: e.target.value })}
                className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text"
              />
              <input
                required
                placeholder="Last verified (YYYY-MM-DD)"
                value={form.lastVerified}
                onChange={(e) => setForm({ ...form, lastVerified: e.target.value })}
                className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text"
              />
            </div>
            <div className="flex gap-2">
              <Btn type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Btn>
              <Btn type="button" variant="ghost" onClick={() => setFormOpen(false)}>
                Cancel
              </Btn>
            </div>
            {formError && <p className="text-xs text-broken">{formError}</p>}
          </form>
        </Card>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
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
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Btn
                          type="button"
                          onClick={() => runHealthCheck(workflow.id)}
                          disabled={loadingId === workflow.id}
                        >
                          {loadingId === workflow.id ? "Checking..." : "Run Health Check"}
                        </Btn>
                        <Btn type="button" variant="ghost" onClick={() => openEdit(workflow)}>
                          Edit
                        </Btn>
                        <Btn type="button" variant="ghost" onClick={() => remove(workflow.id)}>
                          Delete
                        </Btn>
                      </div>
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
    </div>
  );
}
