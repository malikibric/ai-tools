import type { ReviewBrief } from "./schema";

export type SubmissionStatus = "pending" | "approved" | "approved_with_changes" | "rejected";

export type Submission = {
  id: string;
  employeeName: string;
  whatItDoes: string;
  toolOrPromptUsed: string;
  claimedTimeSavedPerWeek: string;
  dataTouched: string;
  status: SubmissionStatus;
  brief: ReviewBrief | null;
};

let submissions: Submission[] = [
  {
    id: "sub-1",
    employeeName: "Ilhan Bajric",
    whatItDoes:
      "Drafts first-pass replies to routine internal IT help-desk tickets (password resets, VPN access requests) so the on-call IT person can review and send instead of writing from scratch.",
    toolOrPromptUsed: "A saved prompt template in the team's Claude workspace, run manually by pasting in the ticket text.",
    claimedTimeSavedPerWeek: "About 2 hours a week, based on roughly 15 tickets at 8 minutes saved each.",
    dataTouched: "Ticket text only — employee name and request type, no credentials or customer data.",
    status: "pending",
    brief: null,
  },
  {
    id: "sub-2",
    employeeName: "Renee Castillo",
    whatItDoes:
      "Auto-generates full customer follow-up emails after every sales call and sends them without review, based on call notes.",
    toolOrPromptUsed: "A no-code AI email tool connected directly to the CRM's send action.",
    claimedTimeSavedPerWeek: "Claims 10 hours a week saved across the team — every follow-up email, fully automated, zero manual review.",
    dataTouched: "Full CRM records: customer names, deal values, and call notes.",
    status: "pending",
    brief: null,
  },
  {
    id: "sub-3",
    employeeName: "Owen Park",
    whatItDoes:
      "Summarizes uploaded vendor contracts, including payment terms and termination clauses, using a free consumer AI chatbot account so the team can skim faster before legal review.",
    toolOrPromptUsed: "A personal account on a free public AI chatbot, contracts pasted in as plain text.",
    claimedTimeSavedPerWeek: "Roughly 3 hours a week across the team.",
    dataTouched: "Full vendor contracts, including payment terms and any client names mentioned in them.",
    status: "pending",
    brief: null,
  },
];

export function getSubmissions(): Submission[] {
  return submissions;
}

export function getSubmissionById(id: string): Submission | undefined {
  return submissions.find((s) => s.id === id);
}

export function addSubmission(input: Omit<Submission, "id" | "status" | "brief">): Submission {
  const submission: Submission = {
    ...input,
    id: `sub-${submissions.length + 1}`,
    status: "pending",
    brief: null,
  };
  submissions.push(submission);
  return submission;
}

export function setSubmissionBrief(id: string, brief: ReviewBrief): Submission | undefined {
  const submission = getSubmissionById(id);
  if (!submission) return undefined;
  submission.brief = brief;
  return submission;
}

export function setSubmissionStatus(id: string, status: SubmissionStatus): Submission | undefined {
  const submission = getSubmissionById(id);
  if (!submission) return undefined;
  submission.status = status;
  return submission;
}
