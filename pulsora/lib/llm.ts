import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";

export const MODEL = process.env.PULSORA_MODEL || "claude-opus-5-5";

/** Demo mode = no API credentials configured. Agents return sample output instead of calling Claude. */
export function isDemoMode(): boolean {
  if (process.env.PULSORA_DEMO === "1") return true;
  return !process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN;
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  client ??= new Anthropic();
  return client;
}

export const BASE_SYSTEM = `You are Pulsora, an autonomous AI Chief Marketing Officer for startups and small businesses.
You think like an experienced growth marketer: specific, practical, evidence-based, never generic.
Everything you write is a DRAFT that a human will review before it is published.
Never invent facts about the company (customers, numbers, awards) that are not in the provided material.
Community content (Reddit, Hacker News) must be genuinely helpful first, never spammy, and must disclose affiliation when the product is mentioned.`;

/**
 * Ask Claude for a JSON object that matches `schema`. Uses structured outputs so the
 * result is validated, and server-side fallbacks so a policy decline is retried on
 * another model automatically.
 */
export async function generateObject<S extends z.ZodType>(opts: {
  schema: S;
  prompt: string;
  system?: string;
  effort?: "low" | "medium" | "high";
}): Promise<z.infer<S>> {
  const response = await getClient().beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    system: opts.system ? `${BASE_SYSTEM}\n\n${opts.system}` : BASE_SYSTEM,
    messages: [{ role: "user", content: opts.prompt }],
    output_config: {
      effort: opts.effort ?? "medium",
      format: betaZodOutputFormat(opts.schema),
    },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
  });

  if (response.stop_reason === "refusal") {
    throw new Error(
      `The model declined this request${response.stop_details?.explanation ? `: ${response.stop_details.explanation}` : "."}`,
    );
  }
  if (response.stop_reason === "max_tokens") {
    throw new Error("The response was cut off (max_tokens). Try again with a narrower request.");
  }
  if (!response.parsed_output) {
    throw new Error("The model returned output that did not match the expected format.");
  }
  return response.parsed_output as z.infer<S>;
}

export function describeError(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError) return "Invalid Anthropic API key. Check ANTHROPIC_API_KEY.";
  if (err instanceof Anthropic.RateLimitError) return "Rate limited by the Claude API. Wait a minute and retry.";
  if (err instanceof Anthropic.BadRequestError) return `Claude API rejected the request: ${err.message}`;
  if (err instanceof Anthropic.APIError) return `Claude API error ${err.status}: ${err.message}`;
  if (err instanceof Error) return err.message;
  return String(err);
}
