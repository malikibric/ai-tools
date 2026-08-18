import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const out: Record<string, unknown> = {};
  try {
    out.connectivity = await prisma.$queryRaw`SELECT 1 as ok`;
  } catch (e) {
    const err = e as { message?: string; code?: string; name?: string };
    return NextResponse.json({ ok: false, stage: "connectivity", error: err.message, code: err.code, name: err.name });
  }
  try {
    const tables = ["AdoptionWorkflow", "DriftWorkflow", "Submission", "SurveyResponse"] as const;
    const counts: Record<string, number> = {};
    for (const t of tables) {
      const row = (await prisma.$queryRawUnsafe(`SELECT count(*)::int AS c FROM "${t}"`)) as { c: number }[];
      counts[t] = row[0]?.c ?? 0;
    }
    out.ok = true;
    out.rowCounts = counts;
    return NextResponse.json(out);
  } catch (e) {
    const err = e as { message?: string; code?: string; name?: string };
    return NextResponse.json({ ok: false, stage: "tables", error: err.message, code: err.code, name: err.name });
  }
}
