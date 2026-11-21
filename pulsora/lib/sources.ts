// Public discussion sources the community agents listen to.
// Reddit: public JSON search (low volume, MVP only — commercial use needs Reddit's Data API agreement).
// Hacker News: the free Algolia HN Search API.

export type Thread = {
  source: "reddit" | "hackernews";
  title: string;
  url: string;
  snippet: string;
  community: string;
  score: number;
  comments: number;
  createdAt: string;
};

const UA = "PulsoraBot/0.1 (marketing research MVP)";

export async function searchReddit(query: string, subreddits: string[], limit = 8): Promise<Thread[]> {
  const subs = subreddits.slice(0, 5).map((s) => s.replace(/^r\//i, "").trim()).filter(Boolean);
  const q = subs.length ? `${query} (${subs.map((s) => `subreddit:${s}`).join(" OR ")})` : query;
  const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(q)}&sort=relevance&t=month&limit=${limit}`;
  try {
    const res = await fetch(url, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      data?: { children?: { data: Record<string, unknown> }[] };
    };
    return (json.data?.children ?? []).map(({ data: d }) => ({
      source: "reddit" as const,
      title: String(d.title ?? ""),
      url: `https://www.reddit.com${d.permalink ?? ""}`,
      snippet: String(d.selftext ?? "").slice(0, 600),
      community: `r/${d.subreddit ?? "?"}`,
      score: Number(d.score ?? 0),
      comments: Number(d.num_comments ?? 0),
      createdAt: new Date(Number(d.created_utc ?? 0) * 1000).toISOString(),
    }));
  } catch {
    return [];
  }
}

export async function searchHackerNews(query: string, limit = 8): Promise<Thread[]> {
  const since = Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 90;
  const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=(story,ask_hn)&numericFilters=created_at_i>${since}&hitsPerPage=${limit}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return [];
    const json = (await res.json()) as { hits?: Record<string, unknown>[] };
    return (json.hits ?? []).map((h) => ({
      source: "hackernews" as const,
      title: String(h.title ?? ""),
      url: `https://news.ycombinator.com/item?id=${h.objectID}`,
      snippet: String(h.story_text ?? "").replace(/<[^>]+>/g, " ").slice(0, 600),
      community: "Hacker News",
      score: Number(h.points ?? 0),
      comments: Number(h.num_comments ?? 0),
      createdAt: String(h.created_at ?? ""),
    }));
  } catch {
    return [];
  }
}

/** Run several keyword searches and de-duplicate by URL. */
export async function findThreads(
  source: "reddit" | "hackernews",
  keywords: string[],
  subreddits: string[] = [],
): Promise<Thread[]> {
  const terms = keywords.slice(0, 3);
  const results = await Promise.all(
    terms.map((k) => (source === "reddit" ? searchReddit(k, subreddits, 6) : searchHackerNews(k, 6))),
  );
  const byUrl = new Map<string, Thread>();
  for (const t of results.flat()) if (t.title && !byUrl.has(t.url)) byUrl.set(t.url, t);
  return [...byUrl.values()].slice(0, 12);
}
