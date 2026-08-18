import type { Metadata } from "next";
import { PageShell } from "@/lib/ui/PageShell";
import {
  getAdoptionWorkflows,
  summarizeAdoption,
} from "@/lib/tools/adoption-evidence/store";
import { AdoptionEvidenceClient } from "./AdoptionEvidenceClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Adoption Evidence Engine — TAI Suite",
  description: "Measures whether approved workflows actually changed the work, via telemetry heartbeats.",
};

export default async function AdoptionEvidencePage() {
  const workflows = await getAdoptionWorkflows();
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
