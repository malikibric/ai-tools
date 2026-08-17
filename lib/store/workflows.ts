import type { DriftAssessment } from "@/lib/schemas/drift-assessment";

export type Workflow = {
  id: string;
  name: string;
  owner: string;
  description: string;
  dependencies: string[];
  dateApproved: string;
  lastVerified: string;
  assessment: DriftAssessment | null;
};

let workflows: Workflow[] = [
  {
    id: "wf-1",
    name: "Weekly Support Ticket Triage",
    owner: "Priya Nandakumar",
    description:
      "Every Monday, pulls the previous week's support tickets from the internal ticket export, classifies each by urgency and topic, and posts a summary to the #support-ops Slack channel. Still runs exactly as documented; the team references the summary every week.",
    dependencies: ["Internal ticket CSV export (unchanged format since 2024)", "Slack webhook to #support-ops"],
    dateApproved: "2025-11-03",
    lastVerified: "2026-07-20",
    assessment: null,
  },
  {
    id: "wf-2",
    name: "Competitor Pricing Digest",
    owner: "Marcus Webb",
    description:
      "Scrapes three competitor pricing pages weekly and drafts a comparison doc. The team mentioned recently that the digest 'looks a little empty lately' but nobody has looked into why.",
    dependencies: [
      "Competitor pricing page scraper (one competitor redesigned their pricing page last quarter)",
      "Google Docs API for the comparison doc",
    ],
    dateApproved: "2025-09-15",
    lastVerified: "2026-02-01",
    assessment: null,
  },
  {
    id: "wf-3",
    name: "Legacy Invoice Summarizer",
    owner: "Dana Ruiz",
    description:
      "Summarizes incoming vendor invoices using the AcmeInvoice v1 API and emails the summary to accounts payable. AcmeInvoice v1 was formally deprecated and shut off; the workflow has not been updated since.",
    dependencies: ["AcmeInvoice API v1 (deprecated, shut down)", "Internal email relay"],
    dateApproved: "2025-06-10",
    lastVerified: "2025-06-10",
    assessment: null,
  },
];

export function getWorkflows(): Workflow[] {
  return workflows;
}

export function getWorkflowById(id: string): Workflow | undefined {
  return workflows.find((w) => w.id === id);
}

export function updateWorkflowAssessment(id: string, assessment: DriftAssessment): Workflow | undefined {
  const workflow = getWorkflowById(id);
  if (!workflow) return undefined;
  workflow.assessment = assessment;
  return workflow;
}
