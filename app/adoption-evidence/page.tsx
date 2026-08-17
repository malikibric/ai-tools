import { PageShell } from "@/lib/ui/PageShell";
import {
  getAdoptionWorkflows,
  summarizeAdoption,
} from "@/lib/store/adoption-workflows";
import { AdoptionEvidenceClient } from "./AdoptionEvidenceClient";

export const dynamic = "force-dynamic";

export default function AdoptionEvidencePage() {
  const workflows = getAdoptionWorkflows();
  const summary = summarizeAdoption(workflows);

  return (
    <PageShell
      title="Adoption Evidence Engine"
      description="Approved workflows phone home with telemetry. TAI measures whether the work actually changed — and proves it to the people paying for the training."
    >
      <AdoptionEvidenceClient initialWorkflows={workflows} initialSummary={summary} />
    </PageShell>
  );
}
