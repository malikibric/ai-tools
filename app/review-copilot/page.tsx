import { PageShell } from "@/lib/ui/PageShell";
import { getSubmissions } from "@/lib/store/submissions";
import { ReviewCopilotClient } from "./ReviewCopilotClient";

export const dynamic = "force-dynamic";

export default function ReviewCopilotPage() {
  const submissions = getSubmissions();

  return (
    <PageShell
      title="Manager Review Copilot"
      description="Employees submit a workflow. The system generates a structured review brief so a manager can actually judge it, not just rubber-stamp it."
    >
      <ReviewCopilotClient initialSubmissions={submissions} />
    </PageShell>
  );
}
