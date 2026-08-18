-- TAI Suite: schema + seed (run once in Supabase SQL Editor)
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "AdoptionWorkflow" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "claimedRunsPerWeek" INTEGER NOT NULL,
    "claimedMinutesPerRun" INTEGER NOT NULL,
    "weeklyRuns" INTEGER[],
    "lastRunAt" TIMESTAMP(3),
    "instrumentedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assessment" JSONB,

    CONSTRAINT "AdoptionWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriftWorkflow" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dependencies" TEXT[],
    "dateApproved" TEXT NOT NULL,
    "lastVerified" TEXT NOT NULL,
    "assessment" JSONB,

    CONSTRAINT "DriftWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "whatItDoes" TEXT NOT NULL,
    "toolOrPromptUsed" TEXT NOT NULL,
    "claimedTimeSavedPerWeek" TEXT NOT NULL,
    "dataTouched" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "brief" JSONB,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyResponse" (
    "id" TEXT NOT NULL,
    "toolsUsed" TEXT NOT NULL,
    "whatFor" TEXT NOT NULL,
    "howOften" TEXT NOT NULL,
    "analysis" JSONB,

    CONSTRAINT "SurveyResponse_pkey" PRIMARY KEY ("id")
);


-- AdoptionWorkflow
INSERT INTO "AdoptionWorkflow" ("id","name","owner","description","claimedRunsPerWeek","claimedMinutesPerRun","weeklyRuns","lastRunAt","instrumentedAt","assessment") VALUES ('ad-1','Weekly Support Ticket Triage','Priya Nandakumar','Pulls the previous week''s support tickets, classifies each by urgency and topic, and posts a summary to #support-ops. The team references the summary every Monday stand-up — usage has grown steadily since launch.',3,12,'{2,2,3,3,3,3,4,4}',now() - interval '1 days',now() - interval '140 days',NULL) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "AdoptionWorkflow" ("id","name","owner","description","claimedRunsPerWeek","claimedMinutesPerRun","weeklyRuns","lastRunAt","instrumentedAt","assessment") VALUES ('ad-2','Competitor Pricing Digest','Marcus Webb','Scrapes three competitor pricing pages and drafts a comparison doc. The team mentioned recently that the digest ''looks a little empty lately'' — run frequency has been quietly sliding for a month.',2,25,'{2,2,2,2,2,1,1,1}',now() - interval '3 days',now() - interval '120 days',NULL) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "AdoptionWorkflow" ("id","name","owner","description","claimedRunsPerWeek","claimedMinutesPerRun","weeklyRuns","lastRunAt","instrumentedAt","assessment") VALUES ('ad-3','Onboarding Brief Generator','Tomas Lindqvist','Generates a personalized onboarding brief for each new hire. Used steadily during the first month after training, then dropped to zero — the team went back to the old manual template.',2,20,'{3,2,2,1,0,0,0,0}',now() - interval '35 days',now() - interval '180 days',NULL) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "AdoptionWorkflow" ("id","name","owner","description","claimedRunsPerWeek","claimedMinutesPerRun","weeklyRuns","lastRunAt","instrumentedAt","assessment") VALUES ('ad-4','Legacy Invoice Summarizer','Dana Ruiz','Summarizes incoming vendor invoices via the AcmeInvoice API and emails the summary to accounts payable. AcmeInvoice v1 was deprecated and shut off — usage collapsed as failures mounted.',2,15,'{4,4,4,4,2,1,1,0}',now() - interval '14 days',now() - interval '200 days',NULL) ON CONFLICT ("id") DO NOTHING;

-- DriftWorkflow
INSERT INTO "DriftWorkflow" ("id","name","owner","description","dependencies","dateApproved","lastVerified","assessment") VALUES ('wf-1','Weekly Support Ticket Triage','Priya Nandakumar','Every Monday, pulls the previous week''s support tickets from the internal ticket export, classifies each by urgency and topic, and posts a summary to the #support-ops Slack channel. Still runs exactly as documented; the team references the summary every week.','{"Internal ticket CSV export (unchanged format since 2024)","Slack webhook to #support-ops"}','2025-11-03','2026-07-20',NULL) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DriftWorkflow" ("id","name","owner","description","dependencies","dateApproved","lastVerified","assessment") VALUES ('wf-2','Competitor Pricing Digest','Marcus Webb','Scrapes three competitor pricing pages weekly and drafts a comparison doc. The team mentioned recently that the digest ''looks a little empty lately'' but nobody has looked into why.','{"Competitor pricing page scraper (one competitor redesigned their pricing page last quarter)","Google Docs API for the comparison doc"}','2025-09-15','2026-02-01',NULL) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DriftWorkflow" ("id","name","owner","description","dependencies","dateApproved","lastVerified","assessment") VALUES ('wf-3','Legacy Invoice Summarizer','Dana Ruiz','Summarizes incoming vendor invoices using the AcmeInvoice v1 API and emails the summary to accounts payable. AcmeInvoice v1 was formally deprecated and shut off; the workflow has not been updated since.','{"AcmeInvoice API v1 (deprecated, shut down)","Internal email relay"}','2025-06-10','2025-06-10',NULL) ON CONFLICT ("id") DO NOTHING;

-- Submission
INSERT INTO "Submission" ("id","employeeName","whatItDoes","toolOrPromptUsed","claimedTimeSavedPerWeek","dataTouched","status","brief") VALUES ('sub-1','Ilhan Bajric','Drafts first-pass replies to routine internal IT help-desk tickets (password resets, VPN access requests) so the on-call IT person can review and send instead of writing from scratch.','A saved prompt template in the team''s Claude workspace, run manually by pasting in the ticket text.','About 2 hours a week, based on roughly 15 tickets at 8 minutes saved each.','Ticket text only — employee name and request type, no credentials or customer data.','pending',NULL) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Submission" ("id","employeeName","whatItDoes","toolOrPromptUsed","claimedTimeSavedPerWeek","dataTouched","status","brief") VALUES ('sub-2','Renee Castillo','Auto-generates full customer follow-up emails after every sales call and sends them without review, based on call notes.','A no-code AI email tool connected directly to the CRM''s send action.','Claims 10 hours a week saved across the team — every follow-up email, fully automated, zero manual review.','Full CRM records: customer names, deal values, and call notes.','pending',NULL) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Submission" ("id","employeeName","whatItDoes","toolOrPromptUsed","claimedTimeSavedPerWeek","dataTouched","status","brief") VALUES ('sub-3','Owen Park','Summarizes uploaded vendor contracts, including payment terms and termination clauses, using a free consumer AI chatbot account so the team can skim faster before legal review.','A personal account on a free public AI chatbot, contracts pasted in as plain text.','Roughly 3 hours a week across the team.','Full vendor contracts, including payment terms and any client names mentioned in them.','pending',NULL) ON CONFLICT ("id") DO NOTHING;

-- SurveyResponse
INSERT INTO "SurveyResponse" ("id","toolsUsed","whatFor","howOften","analysis") VALUES ('resp-1','ChatGPT (company account)','Drafting internal announcement emails and cleaning up meeting notes.','A few times a week.',NULL) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "SurveyResponse" ("id","toolsUsed","whatFor","howOften","analysis") VALUES ('resp-2','GitHub Copilot','Autocompleting boilerplate code while building internal tools.','Daily.',NULL) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "SurveyResponse" ("id","toolsUsed","whatFor","howOften","analysis") VALUES ('resp-3','Personal ChatGPT account','Pasting client contract excerpts in to get a plain-English summary before client calls.','Two or three times a week.',NULL) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "SurveyResponse" ("id","toolsUsed","whatFor","howOften","analysis") VALUES ('resp-4','Midjourney','Generating rough concept images for internal slide decks.','Once or twice a month.',NULL) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "SurveyResponse" ("id","toolsUsed","whatFor","howOften","analysis") VALUES ('resp-5','A free budgeting chatbot app found online','Uploading department budget spreadsheets to get quick variance summaries, since finance''s own tooling is slow.','Weekly, before the department budget review.',NULL) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "SurveyResponse" ("id","toolsUsed","whatFor","howOften","analysis") VALUES ('resp-6','Claude (company account)','Brainstorming outlines for training materials.','A few times a month.',NULL) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "SurveyResponse" ("id","toolsUsed","whatFor","howOften","analysis") VALUES ('resp-7','Grammarly, ChatGPT (company account)','Proofreading external emails and rephrasing awkward sentences.','Daily.',NULL) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "SurveyResponse" ("id","toolsUsed","whatFor","howOften","analysis") VALUES ('resp-8','ChatGPT (company account)','Summarizing long internal Slack threads before status meetings.','A couple times a week.',NULL) ON CONFLICT ("id") DO NOTHING;
