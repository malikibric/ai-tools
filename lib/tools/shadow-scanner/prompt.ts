export function buildSurveyPrompt(answers: { toolsUsed: string; whatFor: string; howOften: string }) {
  return `An employee answered a short survey about informal AI tool usage at work.

What AI tools have you used at work in the last month? ${answers.toolsUsed}
What did you use them for? ${answers.whatFor}
How often? ${answers.howOften}

Extract:
1. The specific AI tools mentioned, as a list.
2. A short use-case category (e.g. "Internal communications", "Software development", "Client document review").
3. An informal-usage risk flag if the response suggests sensitive data handling, no oversight, or use of an unvetted personal/consumer tool for work data — otherwise null.
4. A one-line summary of the response.`;
}
