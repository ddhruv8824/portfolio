import * as cheerio from "cheerio";
import type { PageSnapshot, SiteSnapshot } from "./types";

const UA = "Mozilla/5.0 (compatible; PulsoraBot/0.1; +https://example.com/bot)";
const MAX_PAGES = 5;
// Per-page cap on extracted text so a huge page can't blow up the prompt.
const MAX_TEXT_PER_PAGE = 12_000;
const INTERESTING = /(about|pricing|features|product|solutions|customers|why|how-it-works|platform)/i;

export function normalizeUrl(input: string): string {
  let u = input.trim();
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  const parsed = new URL(u);
  parsed.hash = "";
  return parsed.toString();
}

export async function fetchText(url: string, timeoutMs = 15_000): Promise<{ ok: boolean; status: number; body: string }> {
  try {
    const res = await fetch(url, {
      headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml,*/*" },
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
    });
    return { ok: res.ok, status: res.status, body: await res.text() };
  } catch {
    return { ok: false, status: 0, body: "" };
  }
}

export function extractPage(url: string, html: string): PageSnapshot {
  const $ = cheerio.load(html);
  const title = $("title").first().text().trim();
  const description =
    $('meta[name="description"]').attr("content")?.trim() ||
    $('meta[property="og:description"]').attr("content")?.trim() ||
    "";
  const headings = $("h1, h2, h3")
    .map((_, el) => $(el).text().replace(/\s+/g, " ").trim())
    .get()
    .filter(Boolean)
    .slice(0, 40);
  $("script, style, noscript, svg, iframe").remove();
  const text = $("body").text().replace(/\s+/g, " ").trim().slice(0, MAX_TEXT_PER_PAGE);
  return { url, title, description, headings, text };
}

function internalLinks(baseUrl: string, html: string): string[] {
  const $ = cheerio.load(html);
  const base = new URL(baseUrl);
  const seen = new Set<string>();
  $("a[href]").each((_, el) => {
    try {
      const u = new URL($(el).attr("href")!, base);
      if (u.host !== base.host || !/^https?:$/.test(u.protocol)) return;
      u.hash = "";
      u.search = "";
      if (INTERESTING.test(u.pathname)) seen.add(u.toString());
    } catch {
      /* ignore bad hrefs */
    }
  });
  return [...seen];
}

/** Crawl the homepage plus a few high-signal internal pages (about, pricing, features…). */
export async function crawlSite(inputUrl: string): Promise<{ site: SiteSnapshot; homepageHtml: string }> {
  const url = normalizeUrl(inputUrl);
  const home = await fetchText(url);
  if (!home.ok || !home.body) {
    throw new Error(`Could not load ${url} (status ${home.status || "network error"}).`);
  }
  const homePage = extractPage(url, home.body);
  const links = internalLinks(url, home.body).slice(0, MAX_PAGES - 1);
  const others = await Promise.all(
    links.map(async (l) => {
      const r = await fetchText(l, 10_000);
      return r.ok ? extractPage(l, r.body) : null;
    }),
  );
  const pages = [homePage, ...others.filter((p): p is PageSnapshot => !!p)];
  return {
    site: { url, title: homePage.title, description: homePage.description, pages },
    homepageHtml: home.body,
  };
}

export function siteToPrompt(site: SiteSnapshot): string {
  return site.pages
    .map(
      (p) =>
        `<page url="${p.url}">\nTITLE: ${p.title}\nDESCRIPTION: ${p.description}\nHEADINGS: ${p.headings.join(" | ")}\nTEXT: ${p.text}\n</page>`,
    )
    .join("\n\n");
}
