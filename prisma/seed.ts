import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

async function main() {
  await prisma.surveyResponse.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.driftWorkflow.deleteMany();
  await prisma.adoptionWorkflow.deleteMany();

  await prisma.adoptionWorkflow.createMany({
    data: [
      {
        id: "ad-1",
        name: "Weekly Support Ticket Triage",
        owner: "Priya Nandakumar",
        description:
          "Pulls the previous week's support tickets, classifies each by urgency and topic, and posts a summary to #support-ops. The team references the summary every Monday stand-up — usage has grown steadily since launch.",
        claimedRunsPerWeek: 3,
        claimedMinutesPerRun: 12,
        weeklyRuns: [2, 2, 3, 3, 3, 3, 4, 4],
        lastRunAt: daysAgo(1),
        instrumentedAt: daysAgo(140),
      },
      {
        id: "ad-2",
        name: "Competitor Pricing Digest",
        owner: "Marcus Webb",
        description:
          "Scrapes three competitor pricing pages and drafts a comparison doc. The team mentioned recently that the digest 'looks a little empty lately' — run frequency has been quietly sliding for a month.",
        claimedRunsPerWeek: 2,
        claimedMinutesPerRun: 25,
        weeklyRuns: [2, 2, 2, 2, 2, 1, 1, 1],
        lastRunAt: daysAgo(3),
        instrumentedAt: daysAgo(120),
      },
      {
        id: "ad-3",
        name: "Onboarding Brief Generator",
        owner: "Tomas Lindqvist",
        description:
          "Generates a personalized onboarding brief for each new hire. Used steadily during the first month after training, then dropped to zero — the team went back to the old manual template.",
        claimedRunsPerWeek: 2,
        claimedMinutesPerRun: 20,
        weeklyRuns: [3, 2, 2, 1, 0, 0, 0, 0],
        lastRunAt: daysAgo(35),
        instrumentedAt: daysAgo(180),
      },
      {
        id: "ad-4",
        name: "Legacy Invoice Summarizer",
        owner: "Dana Ruiz",
        description:
          "Summarizes incoming vendor invoices via the AcmeInvoice API and emails the summary to accounts payable. AcmeInvoice v1 was deprecated and shut off — usage collapsed as failures mounted.",
        claimedRunsPerWeek: 2,
        claimedMinutesPerRun: 15,
        weeklyRuns: [4, 4, 4, 4, 2, 1, 1, 0],
        lastRunAt: daysAgo(14),
        instrumentedAt: daysAgo(200),
      },
    ],
  });

  await prisma.driftWorkflow.createMany({
    data: [
      {
        id: "wf-1",
        name: "Weekly Support Ticket Triage",
        owner: "Priya Nandakumar",
        description:
          "Every Monday, pulls the previous week's support tickets from the internal ticket export, classifies each by urgency and topic, and posts a summary to the #support-ops Slack channel. Still runs exactly as documented; the team references the summary every week.",
        dependencies: ["Internal ticket CSV export (unchanged format since 2024)", "Slack webhook to #support-ops"],
        dateApproved: "2025-11-03",
        lastVerified: "2026-07-20",
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
      },
    ],
  });

  await prisma.submission.createMany({
    data: [
      {
        id: "sub-1",
        employeeName: "Ilhan Bajric",
        whatItDoes:
          "Drafts first-pass replies to routine internal IT help-desk tickets (password resets, VPN access requests) so the on-call IT person can review and send instead of writing from scratch.",
        toolOrPromptUsed: "A saved prompt template in the team's Claude workspace, run manually by pasting in the ticket text.",
        claimedTimeSavedPerWeek: "About 2 hours a week, based on roughly 15 tickets at 8 minutes saved each.",
        dataTouched: "Ticket text only — employee name and request type, no credentials or customer data.",
        status: "pending",
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
      },
    ],
  });

  await prisma.surveyResponse.createMany({
    data: [
      {
        id: "resp-1",
        toolsUsed: "ChatGPT (company account)",
        whatFor: "Drafting internal announcement emails and cleaning up meeting notes.",
        howOften: "A few times a week.",
      },
      {
        id: "resp-2",
        toolsUsed: "GitHub Copilot",
        whatFor: "Autocompleting boilerplate code while building internal tools.",
        howOften: "Daily.",
      },
      {
        id: "resp-3",
        toolsUsed: "Personal ChatGPT account",
        whatFor: "Pasting client contract excerpts in to get a plain-English summary before client calls.",
        howOften: "Two or three times a week.",
      },
      {
        id: "resp-4",
        toolsUsed: "Midjourney",
        whatFor: "Generating rough concept images for internal slide decks.",
        howOften: "Once or twice a month.",
      },
      {
        id: "resp-5",
        toolsUsed: "A free budgeting chatbot app found online",
        whatFor:
          "Uploading department budget spreadsheets to get quick variance summaries, since finance's own tooling is slow.",
        howOften: "Weekly, before the department budget review.",
      },
      {
        id: "resp-6",
        toolsUsed: "Claude (company account)",
        whatFor: "Brainstorming outlines for training materials.",
        howOften: "A few times a month.",
      },
      {
        id: "resp-7",
        toolsUsed: "Grammarly, ChatGPT (company account)",
        whatFor: "Proofreading external emails and rephrasing awkward sentences.",
        howOften: "Daily.",
      },
      {
        id: "resp-8",
        toolsUsed: "ChatGPT (company account)",
        whatFor: "Summarizing long internal Slack threads before status meetings.",
        howOften: "A couple times a week.",
      },
    ],
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
