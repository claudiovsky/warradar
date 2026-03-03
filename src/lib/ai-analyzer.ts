import OpenAI from "openai";
import type { ScrapedArticle, AIAnalysis } from "@/types";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const SYSTEM_PROMPT = `You are an expert geopolitical WAR analyst. Your job is to identify ONLY active WARS and ARMED CONFLICTS worldwide from news articles and pinpoint the EXACT CITIES where military/armed combat is occurring.

You MUST ONLY include:
- Active wars between nations or armed groups (Ukraine-Russia, Israel-Gaza, Sudan civil war, etc.)
- Civil wars with organized armed factions fighting (Myanmar, Syria, etc.)
- Armed insurgencies with regular military-style combat (Sahel, Mozambique, DRC, etc.)
- Military operations and invasions
- Armed border conflicts between nations
- Ethnic/sectarian armed conflicts with organized militias
- Genocide and ethnic cleansing campaigns

You MUST EXCLUDE — do NOT include these:
- Civil unrest, protests, demonstrations, riots
- Tram/bus/train accidents or infrastructure incidents
- Criminal gang violence or drug cartel violence
- Individual terrorist attacks (lone wolf, single bombing) unless part of an ongoing war
- Police operations or law enforcement actions
- Political crises without armed combat
- Natural disasters
- Economic crises
- Domestic crime

For each WAR ZONE output:
- location: the SPECIFIC CITY or TOWN name where the armed conflict is happening. NEVER use a country name, region name, or generic area. Always use the most specific city/town possible. For example: "Bakhmut" not "Donetsk region", "Mogadishu" not "Somalia", "Bamako" not "Mali", "Goma" not "North Kivu".
- country: country name
- lat/lng: precise coordinates of THAT SPECIFIC CITY (not the country center)
- severity: "critical" (active large-scale war, daily casualties), "high" (frequent armed clashes, regular combat), "medium" (sporadic military engagements), "low" (low-intensity armed conflict, occasional skirmishes)
- type: "Armed Conflict", "Civil War", "Insurgency", "Military Operation", "Border Conflict", "Ethnic Conflict", "Genocide" — ONLY these types are allowed
- summary: 2-3 sentence description of the current military/armed situation IN THAT CITY
- casualties: estimated recent war casualties if mentioned (string), or null

CRITICAL RULES:
1. ONLY include zones where there is an ACTIVE WAR or ARMED CONFLICT with organized armed groups fighting. If it's just protests, crime, or civil disorder — SKIP IT.
2. Extract EVERY distinct war zone — aim for at least 15-30 zones from a comprehensive scan
3. Split multi-front wars into MULTIPLE CITY entries. For example Ukraine must have separate entries for Kharkiv, Zaporizhzhia, Donetsk, Bakhmut, Kherson, etc. Sudan must have Khartoum, El Fasher, Nyala, El Obeid, etc.
4. Include lesser-known armed conflicts (Cameroon anglophone crisis, Mozambique Cabo Delgado, Colombia FARC remnants, etc.)
5. Do NOT merge different countries into one entry
6. The "location" field MUST ALWAYS be a CITY/TOWN name — NEVER a country, region, province, or state name.
7. Coordinates must point to the specific city, NOT the country centroid
8. Return ONLY a valid JSON object with a "zones" key containing an array
9. If a country is mentioned without a specific city, use the capital or the city most associated with the conflict
10. When in doubt whether something is a "war" — if there are NO organized armed groups fighting each other with weapons, do NOT include it`;

async function analyzeChunk(articles: ScrapedArticle[], chunkIndex: number): Promise<AIAnalysis[]> {
  const articleText = articles
    .map((a, i) => `[${i + 1}] "${a.title}" — ${a.publisher} (${a.date})\n${a.content}`)
    .join("\n\n");

  try {
    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Analyze these ${articles.length} news articles (batch ${chunkIndex + 1}) and extract ALL distinct conflict zones.\n\nArticles:\n${articleText}\n\nReturn JSON: {"zones": [...]}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return [];

    const parsed = JSON.parse(content);
    const zones: AIAnalysis[] = Array.isArray(parsed) ? parsed : parsed.zones || parsed.conflicts || [];
    console.log(`  🧠 Chunk ${chunkIndex + 1}: identified ${zones.length} conflict zones`);
    return zones;
  } catch (err) {
    console.error(`  ✗ AI chunk ${chunkIndex + 1} error:`, err instanceof Error ? err.message : err);
    return [];
  }
}

export async function analyzeArticles(articles: ScrapedArticle[]): Promise<AIAnalysis[]> {
  if (!articles.length) return [];

  // Split into chunks of ~40 articles to stay within token limits but get comprehensive analysis
  const chunkSize = 40;
  const chunks: ScrapedArticle[][] = [];
  for (let i = 0; i < articles.length; i += chunkSize) {
    chunks.push(articles.slice(i, i + chunkSize));
  }

  console.log(`  📦 Processing ${articles.length} articles in ${chunks.length} chunk(s)...`);

  // Process chunks in parallel pairs (2 concurrent) for speed
  const allZones: AIAnalysis[] = [];
  const concurrency = 2;
  for (let i = 0; i < chunks.length; i += concurrency) {
    const batch = chunks.slice(i, i + concurrency);
    const results = await Promise.allSettled(
      batch.map((chunk, idx) => analyzeChunk(chunk, i + idx))
    );
    for (const result of results) {
      if (result.status === "fulfilled") {
        allZones.push(...result.value);
      }
    }
  }

  // Deduplicate zones by location+country
  const seen = new Map<string, AIAnalysis>();
  for (const zone of allZones) {
    const key = `${zone.location?.toLowerCase()}-${zone.country?.toLowerCase()}`;
    const existing = seen.get(key);
    // Keep the one with higher severity
    const severityRank = { critical: 4, high: 3, medium: 2, low: 1 };
    if (!existing || (severityRank[zone.severity] || 0) > (severityRank[existing.severity] || 0)) {
      seen.set(key, zone);
    }
  }

  const deduplicated = Array.from(seen.values());
  console.log(`  🎯 Final: ${deduplicated.length} unique conflict zones (from ${allZones.length} total)`);

  // Fix missing/invalid coordinates
  const fixedZones = await fixMissingCoordinates(deduplicated);
  return fixedZones;
}

function isValidCoord(lat: unknown, lng: unknown): boolean {
  const la = Number(lat);
  const ln = Number(lng);
  return (
    !isNaN(la) && !isNaN(ln) &&
    isFinite(la) && isFinite(ln) &&
    la >= -90 && la <= 90 &&
    ln >= -180 && ln <= 180 &&
    !(la === 0 && ln === 0) // reject 0,0 — likely placeholder
  );
}

async function fixMissingCoordinates(zones: AIAnalysis[]): Promise<AIAnalysis[]> {
  // Separate valid and invalid
  const valid: AIAnalysis[] = [];
  const needsFix: AIAnalysis[] = [];

  for (const zone of zones) {
    // Coerce to number first
    zone.lat = Number(zone.lat);
    zone.lng = Number(zone.lng);

    if (isValidCoord(zone.lat, zone.lng)) {
      valid.push(zone);
    } else {
      needsFix.push(zone);
    }
  }

  if (needsFix.length === 0) {
    console.log(`  ✅ All ${zones.length} zones have valid coordinates`);
    return zones;
  }

  console.log(`  📍 Geocoding ${needsFix.length} zones with missing/invalid coordinates...`);

  // Batch geocode with AI (up to 50 at a time)
  const batchSize = 50;
  for (let i = 0; i < needsFix.length; i += batchSize) {
    const batch = needsFix.slice(i, i + batchSize);
    const locations = batch.map((z, idx) => `${idx + 1}. "${z.location}", ${z.country}`);

    try {
      const response = await getOpenAI().chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a geocoding expert. Given a list of city/town names with their countries, return the precise latitude and longitude coordinates for each. Return ONLY a JSON object with a \"coords\" array where each element has \"idx\" (1-based index), \"lat\" (number), and \"lng\" (number). Coordinates must be precise city-level, not country centroids.",
          },
          {
            role: "user",
            content: `Find precise coordinates for these locations:\n${locations.join("\n")}\n\nReturn JSON: {"coords": [{"idx": 1, "lat": ..., "lng": ...}, ...]}`,
          },
        ],
        temperature: 0,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        const coords: { idx: number; lat: number; lng: number }[] = parsed.coords || [];

        for (const c of coords) {
          const zone = batch[c.idx - 1];
          if (zone && isValidCoord(c.lat, c.lng)) {
            zone.lat = Number(c.lat);
            zone.lng = Number(c.lng);
            console.log(`    ✓ ${zone.location}, ${zone.country} → [${zone.lat}, ${zone.lng}]`);
          }
        }
      }
    } catch (err) {
      console.error(`  ✗ Geocoding batch error:`, err instanceof Error ? err.message : err);
    }
  }

  // Merge back and filter out any still-invalid
  const allFixed = [...valid, ...needsFix];
  const finalValid = allFixed.filter((z) => isValidCoord(z.lat, z.lng));
  const dropped = allFixed.length - finalValid.length;
  if (dropped > 0) {
    console.log(`  ⚠️ Dropped ${dropped} zones that could not be geocoded`);
  }
  console.log(`  ✅ ${finalValid.length} zones with valid coordinates ready`);
  return finalValid;
}
