import type { SurveyAnalysis } from "./schema";

export type SurveyResponse = {
  id: string;
  answers: {
    toolsUsed: string;
    whatFor: string;
    howOften: string;
  };
  analysis: SurveyAnalysis | null;
};

let surveyResponses: SurveyResponse[] = [
  {
    id: "resp-1",
    answers: {
      toolsUsed: "ChatGPT (company account)",
      whatFor: "Drafting internal announcement emails and cleaning up meeting notes.",
      howOften: "A few times a week.",
    },
    analysis: {
      toolsMentioned: ["ChatGPT"],
      useCaseCategory: "Internal communications",
      riskFlag: null,
      summary: "Uses company ChatGPT account for internal writing tasks; no sensitive data involved.",
    },
  },
  {
    id: "resp-2",
    answers: {
      toolsUsed: "GitHub Copilot",
      whatFor: "Autocompleting boilerplate code while building internal tools.",
      howOften: "Daily.",
    },
    analysis: {
      toolsMentioned: ["GitHub Copilot"],
      useCaseCategory: "Software development",
      riskFlag: null,
      summary: "Standard IDE-integrated code completion for internal tooling work.",
    },
  },
  {
    id: "resp-3",
    answers: {
      toolsUsed: "Personal ChatGPT account",
      whatFor: "Pasting client contract excerpts in to get a plain-English summary before client calls.",
      howOften: "Two or three times a week.",
    },
    analysis: {
      toolsMentioned: ["ChatGPT (personal account)"],
      useCaseCategory: "Client document review",
      riskFlag: "Client contract data pasted into a personal (non-company) AI account.",
      summary: "Summarizes client contracts via a personal ChatGPT account ahead of client calls.",
    },
  },
  {
    id: "resp-4",
    answers: {
      toolsUsed: "Midjourney",
      whatFor: "Generating rough concept images for internal slide decks.",
      howOften: "Once or twice a month.",
    },
    analysis: {
      toolsMentioned: ["Midjourney"],
      useCaseCategory: "Presentation design",
      riskFlag: null,
      summary: "Occasional use of Midjourney for non-sensitive internal presentation visuals.",
    },
  },
  {
    id: "resp-5",
    answers: {
      toolsUsed: "A free budgeting chatbot app found online",
      whatFor:
        "Uploading department budget spreadsheets to get quick variance summaries, since finance's own tooling is slow.",
      howOften: "Weekly, before the department budget review.",
    },
    analysis: {
      toolsMentioned: ["Unnamed free budgeting chatbot app"],
      useCaseCategory: "Financial reporting",
      riskFlag: "Department financial data uploaded to an unvetted third-party tool with no IT oversight.",
      summary: "Uploads budget spreadsheets to an unvetted external chatbot for weekly variance summaries.",
    },
  },
  {
    id: "resp-6",
    answers: {
      toolsUsed: "Claude (company account)",
      whatFor: "Brainstorming outlines for training materials.",
      howOften: "A few times a month.",
    },
    analysis: {
      toolsMentioned: ["Claude"],
      useCaseCategory: "Training content creation",
      riskFlag: null,
      summary: "Uses company Claude account to outline training materials; no sensitive data.",
    },
  },
  {
    id: "resp-7",
    answers: {
      toolsUsed: "Grammarly, ChatGPT (company account)",
      whatFor: "Proofreading external emails and rephrasing awkward sentences.",
      howOften: "Daily.",
    },
    analysis: {
      toolsMentioned: ["Grammarly", "ChatGPT"],
      useCaseCategory: "Writing assistance",
      riskFlag: null,
      summary: "Daily use of writing-assistance tools for proofreading outgoing emails.",
    },
  },
  {
    id: "resp-8",
    answers: {
      toolsUsed: "ChatGPT (company account)",
      whatFor: "Summarizing long internal Slack threads before status meetings.",
      howOften: "A couple times a week.",
    },
    analysis: {
      toolsMentioned: ["ChatGPT"],
      useCaseCategory: "Internal communications",
      riskFlag: null,
      summary: "Summarizes internal Slack threads ahead of status meetings using the company ChatGPT account.",
    },
  },
];

export function getSurveyResponses(): SurveyResponse[] {
  return surveyResponses;
}

export function addSurveyResponse(input: SurveyResponse["answers"]): SurveyResponse {
  const response: SurveyResponse = {
    id: `resp-${surveyResponses.length + 1}`,
    answers: input,
    analysis: null,
  };
  surveyResponses.push(response);
  return response;
}

export function setSurveyResponseAnalysis(id: string, analysis: SurveyAnalysis): SurveyResponse | undefined {
  const response = surveyResponses.find((r) => r.id === id);
  if (!response) return undefined;
  response.analysis = analysis;
  return response;
}
