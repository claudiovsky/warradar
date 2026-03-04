import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { scrapeAllSources, fetchNewsAPI, fetchGDELT } from "@/lib/scraper";
import { analyzeArticles } from "@/lib/ai-analyzer";
import { verifyAdmin } from "@/lib/auth";
import type { ConflictZone, Source } from "@/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const auth = await verifyAdmin(request.headers.get("authorization"));
    if (!auth.ok) return auth.response!;

    // Race the pipeline against a 280s timeout (Vercel Pro kills at 300s)
    const timeoutPromise = new Promise<NextResponse>((resolve) =>
      setTimeout(() => resolve(
        NextResponse.json({ error: "Scraping timed out. The pipeline took too long. Try again or check server logs." }, { status: 408 })
      ), 280000)
    );

    const pipelinePromise = runScrapePipeline();
    return await Promise.race([pipelinePromise, timeoutPromise]);
  } catch (error) {
    console.error("Scrape error:", error);
    return NextResponse.json(
      { error: "Scraping failed" },
      { status: 500 }
    );
  }
}

async function runScrapePipeline(): Promise<NextResponse> {
  try {
    console.log("🔍 Starting news scraping...");

    // 1. Scrape news sources in parallel (RSS feeds + NewsAPI + GDELT)
    const [scrapedArticles, newsApiArticles, gdeltArticles] = await Promise.all([
      scrapeAllSources(),
      fetchNewsAPI(),
      fetchGDELT(),
    ]);

    const allArticles = [...scrapedArticles, ...newsApiArticles, ...gdeltArticles];

    // Deduplicate across all sources
    const seen = new Set<string>();
    const uniqueArticles = allArticles.filter((a) => {
      const key = a.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 80);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    console.log(`📰 Found ${uniqueArticles.length} unique conflict articles (RSS: ${scrapedArticles.length}, NewsAPI: ${newsApiArticles.length}, GDELT: ${gdeltArticles.length})`);

    // With Vercel Pro (300s limit), we can process more articles for better coverage
    const allArticlesDeduped = uniqueArticles.slice(0, 200);

    if (allArticlesDeduped.length === 0) {
      return NextResponse.json({
        message: "No new articles found",
        articlesScraped: 0,
        conflictsUpdated: 0,
      });
    }

    // 2. Use AI to analyze and extract conflict zones (send in chunks for better coverage)
    console.log("🤖 Analyzing articles with AI...");
    const analyses = await analyzeArticles(allArticlesDeduped);
    console.log(`🎯 AI identified ${analyses.length} conflict zones`);

    // 3. Store/update in Firestore (batched writes for speed)
    let updated = 0;
    const batch = adminDb.batch();
    for (const analysis of analyses) {
      const conflictId = `${analysis.country}-${analysis.location}`
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-");

      // Find matching articles for sources
      const matchingSources: Source[] = allArticlesDeduped
        .filter(
          (a) =>
            a.title.toLowerCase().includes(analysis.location.toLowerCase()) ||
            a.title.toLowerCase().includes(analysis.country.toLowerCase())
        )
        .slice(0, 5)
        .map((a) => ({
          title: a.title,
          url: a.url,
          publisher: a.publisher,
          date: a.date,
          snippet: a.content.slice(0, 200),
        }));

      // If no matching sources found, use first available articles
      if (matchingSources.length === 0 && allArticlesDeduped.length > 0) {
        matchingSources.push({
          title: allArticlesDeduped[0].title,
          url: allArticlesDeduped[0].url,
          publisher: allArticlesDeduped[0].publisher,
          date: allArticlesDeduped[0].date,
          snippet: allArticlesDeduped[0].content.slice(0, 200),
        });
      }

      const conflict: Omit<ConflictZone, "id"> = {
        name: analysis.location,
        country: analysis.country,
        lat: Number(analysis.lat),
        lng: Number(analysis.lng),
        severity: analysis.severity,
        description: analysis.summary,
        sources: matchingSources,
        lastUpdated: new Date().toISOString(),
        ...(analysis.casualties ? { casualties: analysis.casualties } : {}),
        type: analysis.type,
      };

      const docRef = adminDb.collection("conflicts").doc(conflictId);
      batch.set(docRef, conflict, { merge: true });
      updated++;
    }

    await batch.commit();
    console.log(`✅ Updated ${updated} conflict zones in Firestore (batched)`);

    return NextResponse.json({
      message: "Scraping completed",
      articlesScraped: allArticlesDeduped.length,
      conflictsUpdated: updated,
      zones: analyses.map((a) => `${a.location}, ${a.country}`),
    });
  } catch (error) {
    console.error("Scrape error:", error);
    return NextResponse.json(
      { error: "Scraping failed" },
      { status: 500 }
    );
  }
}
