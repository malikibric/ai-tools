import { NextResponse } from "next/server";
import type { z } from "zod";

export function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: { kind: "invalid_body", message } }, { status: 400 });
}

export function notFound(message: string): NextResponse {
  return NextResponse.json({ error: { kind: "not_found", message } }, { status: 404 });
}

/**
 * Parses and validates a JSON request body against a Zod schema.
 * Returns null for malformed JSON or schema mismatches, so every route
 * can respond with a typed 400 instead of casting and crashing later.
 */
export async function readJsonBody<T extends z.ZodTypeAny>(
  request: Request,
  schema: T
): Promise<z.infer<T> | null> {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
