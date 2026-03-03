import axios from "axios";
import RSSParser from "rss-parser";
import type { ScrapedArticle } from "@/types";

const rssParser = new RSSParser({
  timeout: 5000,
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; WAR-RADAR/1.0)",
    Accept: "application/rss+xml, application/xml, text/xml, */*",
  },
});

// ── RSS Feeds (optimized for speed — all fetched in one parallel batch) ──────
const RSS_FEEDS = [
  // Major international outlets (best coverage, fastest)
  { name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml" },
  { name: "BBC World", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
  { name: "The Guardian World", url: "https://www.theguardian.com/world/rss" },
  { name: "France24", url: "https://www.france24.com/en/rss" },
  { name: "DW News", url: "https://rss.dw.com/xml/rss-en-world" },

  // Regional conflict feeds
  { name: "BBC Middle East", url: "https://feeds.bbci.co.uk/news/world/middle_east/rss.xml" },
  { name: "BBC Africa", url: "https://feeds.bbci.co.uk/news/world/africa/rss.xml" },
  { name: "BBC Asia", url: "https://feeds.bbci.co.uk/news/world/asia/rss.xml" },
  { name: "BBC Europe", url: "https://feeds.bbci.co.uk/news/world/europe/rss.xml" },

  // Specialized conflict & security
  { name: "The War Zone", url: "https://www.thedrive.com/the-war-zone/feed" },
  { name: "Crisis Group", url: "https://www.crisisgroup.org/rss.xml" },
  { name: "UN News Peace", url: "https://news.un.org/feed/subscribe/en/news/topic/peace-and-security/feed/rss.xml" },

  // Key regional
  { name: "Kyiv Independent", url: "https://kyivindependent.com/feed/" },
  { name: "Times of Israel", url: "https://www.timesofisrael.com/feed/" },
  { name: "Sudan Tribune", url: "https://sudantribune.com/feed/" },
];

const CONFLICT_KEYWORDS = [
  // War & armed conflict terms
  "war", "armed conflict", "bombing", "missile", "airstrike", "battle",
  "offensive", "invasion", "troops", "military operation", "shelling",
  "casualties", "soldiers", "fighting", "armed forces", "artillery",
  "siege", "ceasefire", "militia", "insurgent", "rebel", "drone strike",
  "genocide", "massacre", "ambush", "guerrilla", "paramilitary",
  "coup", "junta", "warlord", "crossfire", "mortar",
  "sniper", "IED", "landmine", "chemical weapon",
  "ethnic cleansing", "war crime", "peacekeep", "military intervention",
  "occupation", "annexation", "blockade", "arms",
  "tank", "warship", "fighter jet", "combat",
  "death toll", "killed in action", "battlefield",
  "frontline", "civil war", "armed group",
  // Active war zones that should always match
  "ukraine", "russia", "gaza", "israel", "palestine", "hamas", "hezbollah",
  "sudan", "darfur", "rsf", "myanmar", "rohingya", "yemen", "houthi",
  "syria", "isis", "taliban", "congo", "drc", "kivu", "somalia",
  "al-shabaab", "boko haram", "sahel", "burkina faso", "mali",
  "niger", "ethiopia", "tigray", "amhara", "eritrea",
  "lebanon", "libya",
  "kashmir", "balochistan", "iraq", "kurdish", "PKK",
  "nagorno-karabakh", "armenia", "azerbaij",
  "south sudan", "central african republic", "mozambique", "cabo delgado",
  "cameroon", "anglophone", "chad", "pakistan", "afghanistan",
];

function isConflictRelated(text: string): boolean {
  const lower = text.toLowerCase();
  return CONFLICT_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
}

// ── RSS Scraping ────────────────────────────────────────────────────
async function scrapeRSSFeed(feed: { name: string; url: string }): Promise<ScrapedArticle[]> {
  try {
    const parsed = await rssParser.parseURL(feed.url);
    const articles: ScrapedArticle[] = [];

    for (const item of (parsed.items || []).slice(0, 15)) {
      const title = item.title?.trim() || "";
      const link = item.link || "";
      const snippet = item.contentSnippet || item.content || item.summary || "";
      // Strip HTML tags from content
      const cleanContent = snippet.replace(/<[^>]*>/g, "").trim();
      const fullText = `${title} ${cleanContent}`;

      if (title && link && isConflictRelated(fullText)) {
        articles.push({
          title,
          url: link,
          publisher: feed.name,
          date: item.pubDate || item.isoDate || new Date().toISOString(),
          content: cleanContent.slice(0, 500) || title,
        });
      }
    }
    console.log(`  ✓ ${feed.name}: ${articles.length} conflict articles`);
    return articles;
  } catch (err) {
    console.error(`  ✗ RSS ${feed.name}:`, err instanceof Error ? err.message : String(err));
    return [];
  }
}

export async function scrapeAllSources(): Promise<ScrapedArticle[]> {
  console.log(`📡 Scraping ${RSS_FEEDS.length} RSS feeds...`);

  // Fetch ALL feeds in one parallel batch (15 feeds, 5s timeout each)
  const allArticles: ScrapedArticle[] = [];
  const results = await Promise.allSettled(RSS_FEEDS.map(scrapeRSSFeed));
  for (const result of results) {
    if (result.status === "fulfilled") {
      allArticles.push(...result.value);
    }
  }

  // Deduplicate by normalized title
  const seen = new Set<string>();
  const deduplicated = allArticles.filter((a) => {
    const key = a.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 80);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`📰 Total unique conflict articles from RSS: ${deduplicated.length}`);
  return deduplicated;
}

// ── NewsAPI (multiple targeted queries) ─────────────────────────────
const NEWSAPI_QUERIES = [
  // Broad war queries (combined for fewer API calls)
  '(war OR bombing OR airstrike OR shelling) AND (killed OR casualties OR troops)',
  // Top active conflicts
  'Ukraine AND (Russia OR war OR missile OR frontline)',
  'Gaza AND (Israel OR Hamas OR bombing OR war)',
  'Sudan AND (RSF OR civil war OR Darfur OR fighting)',
  'Myanmar AND (junta OR rebel OR civil war)',
  '(Yemen OR Syria) AND (Houthi OR ISIS OR airstrike OR war)',
  '(Congo OR Somalia OR Ethiopia) AND (M23 OR al-Shabaab OR Tigray OR armed conflict)',
  '(Lebanon OR Libya OR Afghanistan OR Iraq) AND (Hezbollah OR Taliban OR militia OR war)',
];

export async function fetchNewsAPI(): Promise<ScrapedArticle[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey || apiKey === "your_newsapi_key") return [];

  console.log(`🌐 Querying NewsAPI with ${NEWSAPI_QUERIES.length} targeted searches...`);
  const allArticles: ScrapedArticle[] = [];

  // All queries in one parallel batch (8 queries)
  const batchSize = 8;
  for (let i = 0; i < NEWSAPI_QUERIES.length; i += batchSize) {
    const batch = NEWSAPI_QUERIES.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map(async (q) => {
        try {
          const { data } = await axios.get("https://newsapi.org/v2/everything", {
            params: {
              q,
              language: "en",
              sortBy: "publishedAt",
              pageSize: 30,
              from: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // last 3 days
            },
            headers: { "X-Api-Key": apiKey },
            timeout: 5000,
          });
          return (data.articles || []).map(
            (a: { title: string; url: string; source: { name: string }; publishedAt: string; description: string; content: string }) => ({
              title: a.title || "",
              url: a.url || "",
              publisher: a.source?.name || "Unknown",
              date: a.publishedAt || new Date().toISOString(),
              content: `${a.description || ""} ${(a.content || "").replace(/\[\+\d+ chars\]/, "")}`.trim() || a.title,
            })
          );
        } catch (err) {
          // NewsAPI free tier: 100 requests/day — stop on rate limit
          if (axios.isAxiosError(err) && err.response?.status === 429) {
            console.warn("  ⚠ NewsAPI rate limited, skipping remaining queries");
            return [];
          }
          console.error(`  ✗ NewsAPI query failed:`, err instanceof Error ? err.message : String(err));
          return [];
        }
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        allArticles.push(...result.value);
      }
    }

    // Small delay between batches to respect rate limits
    if (i + batchSize < NEWSAPI_QUERIES.length) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  const deduplicated = allArticles.filter((a) => {
    if (!a.title || a.title === "[Removed]") return false;
    const key = a.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 80);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`🌐 Total unique articles from NewsAPI: ${deduplicated.length}`);
  return deduplicated;
}

// ── GDELT API (free, no key needed) ─────────────────────────────────
export async function fetchGDELT(): Promise<ScrapedArticle[]> {
  console.log("🌍 Querying GDELT API...");
  try {
    const { data } = await axios.get("https://api.gdeltproject.org/api/v2/doc/doc", {
      params: {
        query: "conflict OR war OR attack OR bombing OR military sourcecountry:us OR sourcecountry:gb",
        mode: "ArtList",
        maxrecords: 50,
        format: "json",
        timespan: "3d",
        sort: "DateDesc",
      },
      timeout: 5000,
    });

    const articles: ScrapedArticle[] = (data.articles || []).map(
      (a: { title: string; url: string; source: string; seendate: string; socialimage: string }) => ({
        title: a.title || "",
        url: a.url || "",
        publisher: a.source || "GDELT",
        date: a.seendate ? `${a.seendate.slice(0, 4)}-${a.seendate.slice(4, 6)}-${a.seendate.slice(6, 8)}` : new Date().toISOString(),
        content: a.title || "",
      })
    );

    // Filter to conflict-related
    const filtered = articles.filter((a) => isConflictRelated(`${a.title} ${a.content}`));
    console.log(`🌍 GDELT: ${filtered.length} conflict articles`);
    return filtered;
  } catch (err) {
    console.error("  ✗ GDELT error:", err instanceof Error ? err.message : String(err));
    return [];
  }
}
