import { PageShell } from "@/lib/ui/PageShell";
import { getWorkflows } from "@/lib/store/workflows";
import { DriftMonitorClient } from "./DriftMonitorClient";

export const dynamic = "force-dynamic";

export default function DriftMonitorPage() {
  const workflows = getWorkflows();

  return (
    <PageShell
      title="Workflow Drift Monitor"
      description="Approved workflows don't stay healthy forever. Run a health check to see whether a workflow's dependencies or description show signs of drift."
    >
      <DriftMonitorClient initialWorkflows={workflows} />
    </PageShell>
  );
}
