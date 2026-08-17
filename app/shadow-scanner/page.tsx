import { PageShell } from "@/lib/ui/PageShell";
import { SurveyForm } from "./SurveyForm";

export default function ShadowScannerPage() {
  return (
    <PageShell
      title="Shadow AI Discovery Scanner"
      description="A short survey about AI tools employees are already using informally, before any training program starts."
    >
      <SurveyForm />
    </PageShell>
  );
}
