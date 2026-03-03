import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import OpenAI from "openai";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Simple in-memory rate limiter: max 10 AI generations per minute
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10; // max generations per window

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW);
  rateLimitMap.set(ip, recent);
  if (recent.length >= RATE_LIMIT_MAX) return false;
  recent.push(now);
  return true;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const docRef = adminDb.collection("conflicts").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Conflict not found" }, { status: 404 });
    }

    const data = doc.data()!;

    // If already cached, return immediately
    if (data.historicalContext) {
      return NextResponse.json({ historicalContext: data.historicalContext });
    }

    // Rate limit AI generations (not cached responses)
    const clientIp = _request.headers.get("x-forwarded-for") || "anonymous";
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later." },
        { status: 429 }
      );
    }

    // Generate with AI
    const location = data.name || id;
    const country = data.country || "";
    const conflictType = data.type || "Armed Conflict";
    const description = data.description || "";

    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a historian and geopolitical expert. Write a concise but informative historical context about conflicts in a SPECIFIC CITY. Write in English. Use a neutral, journalistic tone.

Structure your response in 4 clear sections (use these exact headers):

**City Profile**
Describe the city itself: population, strategic importance, ethnic/religious composition, and why it is a focal point of conflict (2-3 sentences).

**Conflict History**
The historical roots and evolution of armed conflicts IN THIS SPECIFIC CITY. Include key dates, sieges, battles, occupations, and turning points that happened HERE. Name specific armed groups, militias, or armies involved (3-5 sentences).

**Key Cities & Areas Affected**
List other major cities and towns in the same country that are also affected by related conflicts. For each city, write one sentence describing its role (e.g., frontline, humanitarian hub, occupied territory, refugee destination). Include at least 3-5 cities.

**Current Situation**
How the conflict has evolved to its present state in this city, recent developments, civilian impact, and humanitarian conditions (2-3 sentences).

Keep the total response under 400 words. Be factual and cite specific years and events. Focus on CITIES and URBAN areas, not abstract country-level analysis.`,
        },
        {
          role: "user",
          content: `Write historical context for the conflict in the city of ${location}, ${country}.\nConflict type: ${conflictType}\nCurrent description: ${description}`,
        },
      ],
      temperature: 0.4,
      max_tokens: 800,
    });

    const historicalContext = response.choices[0]?.message?.content || "";

    if (historicalContext) {
      // Cache in Firestore for future requests
      await docRef.update({ historicalContext });
    }

    return NextResponse.json({ historicalContext });
  } catch (error) {
    console.error("History generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate historical context" },
      { status: 500 }
    );
  }
}
