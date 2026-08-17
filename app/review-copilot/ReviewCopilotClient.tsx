"use client";

import { useState } from "react";
import { Card } from "@/lib/ui/Card";
import { Badge } from "./Badge";
import type { Submission, SubmissionStatus } from "@/lib/tools/review-copilot/store";
import type { ReviewBrief } from "@/lib/tools/review-copilot/schema";

const STATUS_LABELS: Record<SubmissionStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  approved_with_changes: "Approved with changes",
  rejected: "Rejected",
};

const RECOMMENDATION_LABELS: Record<ReviewBrief["recommendation"], string> = {
  approve: "Approve",
  approve_with_changes: "Approve with changes",
  needs_discussion: "Needs discussion",
};

const EMPTY_FORM = {
  employeeName: "",
  whatItDoes: "",
  toolOrPromptUsed: "",
  claimedTimeSavedPerWeek: "",
  dataTouched: "",
};

export function ReviewCopilotClient({ initialSubmissions }: { initialSubmissions: Submission[] }) {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [selectedId, setSelectedId] = useState<string | null>(initialSubmissions[0]?.id ?? null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errorBySubmission, setErrorBySubmission] = useState<Record<string, string>>({});

  const selected = submissions.find((s) => s.id === selectedId) ?? null;

  async function generateBrief(id: string) {
    setLoadingId(id);
    setErrorBySubmission((prev) => ({ ...prev, [id]: "" }));
    try {
      const response = await fetch("/api/review-copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await response.json();
      if (!response.ok) {
        setErrorBySubmission((prev) => ({
          ...prev,
          [id]: data.error?.message ?? "Failed to generate review brief.",
        }));
        return;
      }
      setSubmissions((prev) => prev.map((s) => (s.id === id ? data.submission : s)));
    } finally {
      setLoadingId(null);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/review-copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error?.message ?? "Failed to generate review brief.");
        if (data.submission) {
          setSubmissions((prev) => [...prev, data.submission]);
          setSelectedId(data.submission.id);
        }
        return;
      }
      setSubmissions((prev) => [...prev, data.submission]);
      setSelectedId(data.submission.id);
      setForm(EMPTY_FORM);
    } finally {
      setSubmitting(false);
    }
  }

  async function updateStatus(status: SubmissionStatus) {
    if (!selected) return;
    const response = await fetch("/api/review-copilot", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selected.id, status }),
    });
    const data = await response.json();
    if (response.ok) {
      setSubmissions((prev) => prev.map((s) => (s.id === selected.id ? data.submission : s)));
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <Card>
          <h2 className="font-display text-base font-semibold text-text">Submit a workflow</h2>
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <input
              required
              placeholder="Your name"
              value={form.employeeName}
              onChange={(e) => setForm({ ...form, employeeName: e.target.value })}
              className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text"
            />
            <textarea
              required
              placeholder="What does the workflow do?"
              value={form.whatItDoes}
              onChange={(e) => setForm({ ...form, whatItDoes: e.target.value })}
              className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text"
              rows={3}
            />
            <input
              required
              placeholder="What tool/prompt/process does it use?"
              value={form.toolOrPromptUsed}
              onChange={(e) => setForm({ ...form, toolOrPromptUsed: e.target.value })}
              className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text"
            />
            <input
              required
              placeholder="Claimed time saved per week"
              value={form.claimedTimeSavedPerWeek}
              onChange={(e) => setForm({ ...form, claimedTimeSavedPerWeek: e.target.value })}
              className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text"
            />
            <input
              required
              placeholder="What data does it touch?"
              value={form.dataTouched}
              onChange={(e) => setForm({ ...form, dataTouched: e.target.value })}
              className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text"
            />
            <button
              type="submit"
              disabled={submitting}
              className="rounded border border-amber px-4 py-2 font-mono text-xs uppercase tracking-wide text-amber hover:bg-amber-soft disabled:opacity-50"
            >
              {submitting ? "Generating brief..." : "Submit for review"}
            </button>
            {error && <p className="text-xs text-broken">{error}</p>}
          </form>
        </Card>

        <Card>
          <h2 className="font-display text-base font-semibold text-text">Submissions</h2>
          <div className="mt-3 space-y-2">
            {submissions.map((submission) => (
              <button
                key={submission.id}
                type="button"
                onClick={() => setSelectedId(submission.id)}
                className={`block w-full rounded border px-3 py-2 text-left text-sm ${
                  selectedId === submission.id ? "border-amber text-text" : "border-border text-text-muted"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span>{submission.employeeName}</span>
                  <Badge>{STATUS_LABELS[submission.status]}</Badge>
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        {!selected && <p className="text-sm text-text-muted">Select a submission to see its review brief.</p>}
        {selected && !selected.brief && (
          <div>
            <h3 className="font-display text-base font-semibold text-text">
              {selected.employeeName}&apos;s workflow
            </h3>
            <p className="mt-2 text-sm text-text-muted">
              No review brief yet. Generate one to see a plain-language explanation, questions to ask, and risk flags.
            </p>
            <button
              type="button"
              onClick={() => generateBrief(selected.id)}
              disabled={loadingId === selected.id}
              className="mt-4 rounded border border-amber px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-amber hover:bg-amber-soft disabled:opacity-50"
            >
              {loadingId === selected.id ? "Generating..." : "Generate Review Brief"}
            </button>
            {errorBySubmission[selected.id] && (
              <p className="mt-2 text-xs text-broken">{errorBySubmission[selected.id]}</p>
            )}
          </div>
        )}
        {selected?.brief && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-base font-semibold text-text">{selected.employeeName}&apos;s workflow</h3>
              <Badge>{RECOMMENDATION_LABELS[selected.brief.recommendation]}</Badge>
            </div>
            <p className="text-sm text-text">{selected.brief.plainLanguageExplanation}</p>

            <div>
              <p className="font-mono text-xs uppercase tracking-wide text-text-muted">Questions to ask</p>
              <ul className="mt-1 list-inside list-disc text-sm text-text">
                {selected.brief.managerQuestions.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ul>
            </div>

            {selected.brief.riskFlags.length > 0 && (
              <div>
                <p className="font-mono text-xs uppercase tracking-wide text-broken">Risk flags</p>
                <ul className="mt-1 list-inside list-disc text-sm text-broken">
                  {selected.brief.riskFlags.map((flag) => (
                    <li key={flag}>{flag}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-sm text-text-muted">{selected.brief.recommendationReasoning}</p>

            <div className="flex gap-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => updateStatus("approved")}
                className="rounded border border-healthy px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-healthy hover:bg-healthy/15"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => updateStatus("approved_with_changes")}
                className="rounded border border-at-risk px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-at-risk hover:bg-at-risk/15"
              >
                Approve with changes
              </button>
              <button
                type="button"
                onClick={() => updateStatus("rejected")}
                className="rounded border border-broken px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-broken hover:bg-broken/15"
              >
                Reject
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
