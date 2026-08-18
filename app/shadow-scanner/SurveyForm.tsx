"use client";

import { useState } from "react";
import { Card } from "@/lib/ui/Card";
import { Btn } from "@/lib/ui/Btn";
import type { SurveyResponse } from "@/lib/tools/shadow-scanner/store";

const EMPTY_FORM = { toolsUsed: "", whatFor: "", howOften: "" };

export function SurveyForm({ initialResponses }: { initialResponses: SurveyResponse[] }) {
  const [responses, setResponses] = useState(initialResponses);
  const [selectedId, setSelectedId] = useState<string | null>(initialResponses[0]?.id ?? null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const selected = responses.find((r) => r.id === selectedId) ?? null;

  async function refresh() {
    const res = await fetch("/api/shadow-scanner");
    if (res.ok) {
      const data = await res.json();
      setResponses(data.responses);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    const url = editingId ? `/api/shadow-scanner/${editingId}` : "/api/shadow-scanner";
    const response = await fetch(url, {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await response.json();
    if (!response.ok) {
      setFormError(data.error?.message ?? "Failed to save response.");
      setSaving(false);
      return;
    }
    setResponses((prev) => [data.response, ...prev.filter((r) => r.id !== data.response.id)]);
    setSelectedId(data.response.id);
    setForm(EMPTY_FORM);
    setEditingId(null);
    setSaving(false);
  }

  function openEdit(response: SurveyResponse) {
    setEditingId(response.id);
    setForm({
      toolsUsed: response.answers.toolsUsed,
      whatFor: response.answers.whatFor,
      howOften: response.answers.howOften,
    });
  }

  async function remove(id: string) {
    if (!confirm("Delete this response?")) return;
    const response = await fetch(`/api/shadow-scanner/${id}`, { method: "DELETE" });
    if (response.ok) {
      await refresh();
      if (selectedId === id) setSelectedId(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <h2 className="font-display text-base font-semibold text-text">
          {editingId ? "Edit response" : "Share how you're using AI"}
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          No names required. Tell us what AI tools you use at work, what for, and how often.
        </p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <label className="block text-sm text-text-muted">
            What AI tools have you used at work in the last month?
            <textarea
              required
              value={form.toolsUsed}
              onChange={(e) => setForm({ ...form, toolsUsed: e.target.value })}
              className="mt-1 w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text"
              rows={2}
            />
          </label>
          <label className="block text-sm text-text-muted">
            What did you use them for, and how?
            <textarea
              required
              value={form.whatFor}
              onChange={(e) => setForm({ ...form, whatFor: e.target.value })}
              className="mt-1 w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text"
              rows={3}
            />
          </label>
          <label className="block text-sm text-text-muted">
            How often?
            <input
              required
              value={form.howOften}
              onChange={(e) => setForm({ ...form, howOften: e.target.value })}
              className="mt-1 w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text"
            />
          </label>
          <div className="flex gap-2">
            <Btn type="submit" disabled={saving}>
              {saving ? (editingId ? "Saving..." : "Submitting...") : editingId ? "Save changes" : "Submit response"}
            </Btn>
            {editingId && (
              <Btn
                type="button"
                variant="ghost"
                onClick={() => {
                  setEditingId(null);
                  setForm(EMPTY_FORM);
                }}
              >
                Cancel
              </Btn>
            )}
          </div>
          {formError && <p className="text-xs text-broken">{formError}</p>}
        </form>

        <div className="mt-6 border-t border-border pt-4">
          <h3 className="font-mono text-xs uppercase tracking-wide text-text-muted">Responses</h3>
          <div className="mt-2 space-y-2">
            {responses.map((response) => (
              <div
                key={response.id}
                className={`rounded border px-3 py-2 ${
                  selectedId === response.id ? "border-amber" : "border-border"
                }`}
              >
                <button type="button" onClick={() => setSelectedId(response.id)} className="w-full text-left">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm text-text">{response.answers.toolsUsed || "Untitled"}</span>
                    {response.analysis?.riskFlag && (
                      <span className="rounded border border-broken px-2 py-0.5 text-xs text-broken">Risk</span>
                    )}
                  </div>
                </button>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(response)}
                    className="font-mono text-xs uppercase tracking-wide text-text-muted hover:text-amber"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(response.id)}
                    className="font-mono text-xs uppercase tracking-wide text-text-muted hover:text-broken"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        {!selected && <p className="text-sm text-text-muted">Select a response to see the extracted analysis.</p>}
        {selected?.analysis && (
          <div className="space-y-4">
            <h3 className="font-display text-base font-semibold text-text">Extracted analysis</h3>
            <p className="text-sm italic text-text-muted">&ldquo;{selected.answers.whatFor}&rdquo;</p>

            <div>
              <p className="font-mono text-xs uppercase tracking-wide text-text-muted">Tools mentioned</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {selected.analysis.toolsMentioned.map((tool) => (
                  <span key={tool} className="rounded border border-border px-2 py-1 text-xs text-text">
                    {tool}
                  </span>
                ))}
              </div>
            </div>

            <p className="text-sm text-text">
              <span className="text-text-muted">Use case category: </span>
              {selected.analysis.useCaseCategory}
            </p>

            {selected.analysis.riskFlag && (
              <div>
                <p className="font-mono text-xs uppercase tracking-wide text-broken">Risk flag</p>
                <p className="mt-1 text-sm text-broken">{selected.analysis.riskFlag}</p>
              </div>
            )}

            <p className="text-sm text-text">{selected.analysis.summary}</p>
          </div>
        )}
      </Card>
    </div>
  );
}
