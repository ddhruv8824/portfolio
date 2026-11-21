import * as cheerio from "cheerio";
import { z } from "zod";
import { fetchText } from "./crawl";
import { generateObject, isDemoMode } from "./llm";
import type { Audit, AuditCheck, AuditFix, Strategy } from "./types";

/** Deterministic technical SEO + GEO (AI-search readiness) checks on the homepage. */
export async function runChecks(url: string, html: string): Promise<AuditCheck[]> {
  const $ = cheerio.load(html);
  const origin = new URL(url).origin;
  const checks: AuditCheck[] = [];
  const add = (id: string, label: string, status: AuditCheck["status"], detail: string) =>
    checks.push({ id, label, status, detail });

  add("https", "Served over HTTPS", url.startsWith("https://") ? "pass" : "fail",
    url.startsWith("https://") ? "Site uses HTTPS." : "Site is not on HTTPS — browsers and Google penalise this.");

  const title = $("title").first().text().trim();
  add("title", "Page title", !title ? "fail" : title.length < 25 || title.length > 65 ? "warn" : "pass",
    !title ? "No <title> tag." : `"${title}" (${title.length} chars; aim for 25–65).`);

  const desc = $('meta[name="description"]').attr("content")?.trim() ?? "";
  add("description", "Meta description", !desc ? "fail" : desc.length < 70 || desc.length > 160 ? "warn" : "pass",
    !desc ? "No meta description." : `${desc.length} chars (aim for 70–160).`);

  const h1 = $("h1").length;
  add("h1", "Single H1 heading", h1 === 1 ? "pass" : h1 === 0 ? "fail" : "warn",
    h1 === 1 ? "Exactly one H1." : h1 === 0 ? "No H1 heading found." : `${h1} H1 headings found; use one.`);

  const imgs = $("img");
  const noAlt = imgs.filter((_, el) => !$(el).attr("alt")?.trim()).length;
  add("alt", "Image alt text", noAlt === 0 ? "pass" : noAlt / Math.max(imgs.length, 1) > 0.3 ? "fail" : "warn",
    imgs.length === 0 ? "No images on the page." : `${noAlt} of ${imgs.length} images are missing alt text.`);

  add("viewport", "Mobile viewport", $('meta[name="viewport"]').length ? "pass" : "fail",
    $('meta[name="viewport"]').length ? "Viewport meta tag present." : "Missing viewport meta tag — page may not be mobile friendly.");

  add("canonical", "Canonical URL", $('link[rel="canonical"]').length ? "pass" : "warn",
    $('link[rel="canonical"]').attr("href") ?? "No canonical link tag.");

  const og = ["og:title", "og:description", "og:image"].filter((p) => !$(`meta[property="${p}"]`).length);
  add("og", "Open Graph tags (social previews)", og.length === 0 ? "pass" : og.length === 3 ? "fail" : "warn",
    og.length === 0 ? "All core OG tags present." : `Missing: ${og.join(", ")}.`);

  const jsonLd = $('script[type="application/ld+json"]').length;
  add("schema", "Structured data (JSON-LD)", jsonLd ? "pass" : "warn",
    jsonLd ? `${jsonLd} JSON-LD block(s) found.` : "No schema.org JSON-LD — helps Google and AI engines understand you.");

  const lang = $("html").attr("lang");
  add("lang", "HTML lang attribute", lang ? "pass" : "warn", lang ? `lang="${lang}"` : "Missing lang attribute on <html>.");

  const kb = Math.round(html.length / 1024);
  add("size", "HTML size", kb < 200 ? "pass" : kb < 500 ? "warn" : "fail", `${kb} KB of HTML.`);

  const [robots, sitemap, llms] = await Promise.all([
    fetchText(`${origin}/robots.txt`, 8000),
    fetchText(`${origin}/sitemap.xml`, 8000),
    fetchText(`${origin}/llms.txt`, 8000),
  ]);
  add("robots", "robots.txt", robots.ok ? "pass" : "warn", robots.ok ? "Found." : "No robots.txt found.");
  add("sitemap", "sitemap.xml", sitemap.ok && sitemap.body.includes("<") ? "pass" : "warn",
    sitemap.ok ? "Found." : "No sitemap.xml at the root.");
  add("llms", "llms.txt (AI search / GEO)", llms.ok ? "pass" : "warn",
    llms.ok ? "Found — AI assistants can read a summary of your site." : "No llms.txt — add one so AI assistants can understand and cite you.");

  return checks;
}

export function scoreChecks(checks: AuditCheck[]): number {
  const pts = checks.reduce((s, c) => s + (c.status === "pass" ? 1 : c.status === "warn" ? 0.5 : 0), 0);
  return Math.round((pts / checks.length) * 100);
}

const FixesSchema = z.object({
  fixes: z.array(
    z.object({
      issue: z.string(),
      fix: z.string().describe("Plain-language explanation of what to change and why"),
      snippet: z.string().describe("Ready-to-paste HTML/text snippet, or empty string if not applicable"),
    }),
  ),
});

export async function buildAudit(url: string, html: string, strategy: Strategy): Promise<Audit> {
  const checks = await runChecks(url, html);
  const failing = checks.filter((c) => c.status !== "pass");
  let fixes: AuditFix[] = [];

  if (failing.length && !isDemoMode()) {
    const out = await generateObject({
      schema: FixesSchema,
      effort: "low",
      system: "You are acting as Pulsora's SEO & GEO agent. Write concrete fixes with copy tailored to this company.",
      prompt: `Company: ${strategy.companyName} — ${strategy.oneLiner}
Target keywords: ${strategy.keywords.join(", ")}
URL: ${url}

These homepage checks did not pass:
${failing.map((c) => `- ${c.label}: ${c.detail}`).join("\n")}

For each failing check, give a specific fix. Where useful, include a ready-to-paste snippet
(e.g. an improved <title>, a meta description, JSON-LD Organization/SoftwareApplication schema,
or a full llms.txt file) written specifically for this company.`,
    });
    fixes = out.fixes.map((f) => ({ ...f, snippet: f.snippet || undefined }));
  } else if (failing.length) {
    fixes = failing.map((c) => ({
      issue: c.label,
      fix: `DEMO MODE: add an ANTHROPIC_API_KEY to get a tailored fix. Check result: ${c.detail}`,
    }));
  }

  return { score: scoreChecks(checks), checkedAt: new Date().toISOString(), checks, fixes };
}
