import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { scrapeAllSources, fetchNewsAPI, fetchGDELT } from "@/lib/scraper";
import { analyzeArticles } from "@/lib/ai-analyzer";
import type { ConflictZone, Source } from "@/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  // Verify this is a legitimate Vercel cron call
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("⏰ Cron: Starting scheduled news scraping...");

    const [scrapedArticles, newsApiArticles, gdeltArticles] = await Promise.all([
      scrapeAllSources(),
      fetchNewsAPI(),
      fetchGDELT(),
    ]);

    const allArticles = [...scrapedArticles, ...newsApiArticles, ...gdeltArticles];

    const seen = new Set<string>();
    const uniqueArticles = allArticles.filter((a) => {
      const key = a.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 80);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    console.log(`📰 Cron: ${uniqueArticles.length} unique articles (RSS: ${scrapedArticles.length}, NewsAPI: ${newsApiArticles.length}, GDELT: ${gdeltArticles.length})`);

    // With Vercel Pro (300s limit), we can process more articles for better coverage
    const cappedArticles = uniqueArticles.slice(0, 200);

    if (cappedArticles.length === 0) {
      return NextResponse.json({
        message: "No new articles found",
        articlesScraped: 0,
        conflictsUpdated: 0,
      });
    }

    console.log("🤖 Cron: Analyzing articles with AI...");
    const analyses = await analyzeArticles(cappedArticles);
    console.log(`🎯 Cron: AI identified ${analyses.length} conflict zones`);

    let updated = 0;
    const batch = adminDb.batch();
    for (const analysis of analyses) {
      const conflictId = `${analysis.country}-${analysis.location}`
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-");

      const matchingSources: Source[] = cappedArticles
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

      if (matchingSources.length === 0 && cappedArticles.length > 0) {
        matchingSources.push({
          title: cappedArticles[0].title,
          url: cappedArticles[0].url,
          publisher: cappedArticles[0].publisher,
          date: cappedArticles[0].date,
          snippet: cappedArticles[0].content.slice(0, 200),
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
    console.log(`✅ Cron: Updated ${updated} conflict zones (batched)`);

    return NextResponse.json({
      message: "Cron scraping completed",
      articlesScraped: cappedArticles.length,
      conflictsUpdated: updated,
    });
  } catch (error) {
    console.error("Cron scrape error:", error);
    return NextResponse.json({ error: "Cron scraping failed" }, { status: 500 });
  }
}
