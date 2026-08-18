import { NextResponse } from "next/server";
import type { z } from "zod";

export function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: { kind: "invalid_body", message } }, { status: 400 });
}

export function notFound(message: string): NextResponse {
  return NextResponse.json({ error: { kind: "not_found", message } }, { status: 404 });
}

function serverError(message: string): NextResponse {
  return NextResponse.json({ error: { kind: "server_error", message } }, { status: 500 });
}

/**
 * Wraps a route handler so an unexpected throw (e.g. the database is
 * unreachable) returns a typed JSON error instead of Next's generic HTML
 * error page. AI-calling routes still catch their own errors inline for a
 * more specific 502; this is the outer safety net for everything else.
 */
export function withDbErrors<Args extends unknown[]>(
  handler: (...args: Args) => Promise<NextResponse>
): (...args: Args) => Promise<NextResponse> {
  return async (...args: Args) => {
    try {
      return await handler(...args);
    } catch {
      return serverError("Something went wrong talking to the database. Try again.");
    }
  };
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
