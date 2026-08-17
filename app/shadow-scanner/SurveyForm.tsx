"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/lib/ui/Card";

const EMPTY_FORM = { toolsUsed: "", whatFor: "", howOften: "" };

export function SurveyForm() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/shadow-scanner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error?.message ?? "Failed to submit response.");
        return;
      }
      setSubmitted(true);
      setForm(EMPTY_FORM);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <Card>
        <p className="text-sm text-text">Thanks — your response has been recorded.</p>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="rounded border border-amber px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-amber hover:bg-amber-soft"
          >
            Submit another response
          </button>
          <Link
            href="/shadow-scanner/aggregate"
            className="rounded border border-border px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-text-muted hover:text-text"
          >
            View aggregate results
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-3">
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
        <button
          type="submit"
          disabled={submitting}
          className="rounded border border-amber px-4 py-2 font-mono text-xs uppercase tracking-wide text-amber hover:bg-amber-soft disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit response"}
        </button>
        {error && <p className="text-xs text-broken">{error}</p>}
      </form>
    </Card>
  );
}
