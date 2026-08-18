import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { ZodSchema } from "zod";

export class MissingApiKeyError extends Error {
  constructor() {
    super("GOOGLE_API_KEY is not set.");
    this.name = "MissingApiKeyError";
  }
}

export class AICallError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "AICallError";
  }
}

const MODEL_ID = process.env.GOOGLE_MODEL ?? "gemini-3.5-flash-lite";
const googleProvider = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_API_KEY });

export async function callStructured<T>(schema: ZodSchema<T>, prompt: string): Promise<T> {
  if (!process.env.GOOGLE_API_KEY) {
    throw new MissingApiKeyError();
  }

  try {
    const { object } = await generateObject({
      model: googleProvider(MODEL_ID),
      schema,
      prompt,
    });
    return object;
  } catch (error) {
    if (error instanceof MissingApiKeyError) {
      throw error;
    }
    throw new AICallError(
      "The model call failed or returned output that didn't match the expected schema.",
      error
    );
  }
}

export type StructuredCallErrorKind = "missing_api_key" | "ai_call_failed";

export function classifyError(error: unknown): { kind: StructuredCallErrorKind; message: string } {
  if (error instanceof MissingApiKeyError) {
    return { kind: "missing_api_key", message: "AI service unavailable — GOOGLE_API_KEY is not set." };
  }
  return { kind: "ai_call_failed", message: "Model returned unexpected output, try again." };
}
