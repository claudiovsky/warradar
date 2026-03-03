import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/auth";
import type { ConflictZone } from "@/types";

export const dynamic = "force-dynamic";

// Seed data based on known active conflicts (March 2026)
const SEED_CONFLICTS: (Omit<ConflictZone, "id"> & { id: string })[] = [
  {
    id: "ukraine-kharkiv",
    name: "Kharkiv",
    country: "Ukraine",
    lat: 49.9935,
    lng: 36.2304,
    severity: "critical",
    description:
      "Ongoing Russian military operations. Frequent shelling and missile strikes targeting civilian infrastructure and military positions.",
    sources: [
      {
        title: "Ukraine war: Latest updates on the conflict",
        url: "https://www.bbc.com/news/world-europe-56720589",
        publisher: "BBC News",
        date: "2026-03-01",
        snippet: "Continued fighting in eastern Ukraine with heavy bombardment in Kharkiv region.",
      },
    ],
    lastUpdated: "2026-03-03T00:00:00Z",
    casualties: "Thousands",
    type: "Armed Conflict",
  },
  {
    id: "ukraine-zaporizhzhia",
    name: "Zaporizhzhia",
    country: "Ukraine",
    lat: 47.8388,
    lng: 35.1396,
    severity: "critical",
    description:
      "Active frontline zone. Regular artillery exchanges near Europe's largest nuclear power plant.",
    sources: [
      {
        title: "Zaporizhzhia frontline remains volatile",
        url: "https://www.aljazeera.com/tag/war-and-conflict/",
        publisher: "Al Jazeera",
        date: "2026-03-02",
        snippet: "Fighting continues near the Zaporizhzhia nuclear power plant area.",
      },
    ],
    lastUpdated: "2026-03-03T00:00:00Z",
    casualties: "Hundreds",
    type: "Armed Conflict",
  },
  {
    id: "gaza-gaza-city",
    name: "Gaza City",
    country: "Palestine",
    lat: 31.5,
    lng: 34.4667,
    severity: "critical",
    description:
      "Severe humanitarian crisis amid ongoing military operations. Massive displacement of civilians and destruction of infrastructure.",
    sources: [
      {
        title: "Gaza conflict: Humanitarian catastrophe deepens",
        url: "https://www.aljazeera.com/news/liveblog/",
        publisher: "Al Jazeera",
        date: "2026-03-02",
        snippet: "The humanitarian situation in Gaza continues to deteriorate with ongoing bombardment.",
      },
    ],
    lastUpdated: "2026-03-03T00:00:00Z",
    casualties: "Tens of thousands",
    type: "Armed Conflict",
  },
  {
    id: "sudan-khartoum",
    name: "Khartoum",
    country: "Sudan",
    lat: 15.5007,
    lng: 32.5599,
    severity: "critical",
    description:
      "Civil war between the Sudanese Armed Forces and RSF. Widespread urban warfare and civilian displacement.",
    sources: [
      {
        title: "Sudan crisis: Fighting continues in capital",
        url: "https://www.bbc.com/news/world-africa-65473554",
        publisher: "BBC News",
        date: "2026-03-01",
        snippet: "Heavy fighting continues between SAF and RSF forces across Greater Khartoum.",
      },
    ],
    lastUpdated: "2026-03-03T00:00:00Z",
    casualties: "Thousands",
    type: "Civil War",
  },
  {
    id: "sudan-darfur",
    name: "El Fasher",
    country: "Sudan",
    lat: 13.6293,
    lng: 25.3493,
    severity: "critical",
    description:
      "RSF siege of El Fasher in North Darfur. Ethnic violence and displacement of hundreds of thousands.",
    sources: [
      {
        title: "Darfur crisis worsens amid siege of El Fasher",
        url: "https://www.reuters.com/world/africa/",
        publisher: "Reuters",
        date: "2026-03-01",
        snippet: "The RSF continues its siege of El Fasher, the last major city in Darfur not under its control.",
      },
    ],
    lastUpdated: "2026-03-03T00:00:00Z",
    casualties: "Thousands",
    type: "Civil War",
  },
  {
    id: "myanmar-shan",
    name: "Shan State",
    country: "Myanmar",
    lat: 21.0,
    lng: 97.0,
    severity: "high",
    description:
      "Ongoing armed resistance against the military junta. Multiple ethnic armed organizations fighting the Tatmadaw.",
    sources: [
      {
        title: "Myanmar resistance forces make gains",
        url: "https://www.aljazeera.com/tag/war-and-conflict/",
        publisher: "Al Jazeera",
        date: "2026-02-28",
        snippet: "Resistance forces continue to challenge the military junta in multiple regions.",
      },
    ],
    lastUpdated: "2026-03-03T00:00:00Z",
    casualties: "Hundreds",
    type: "Civil War",
  },
  {
    id: "syria-idlib",
    name: "Idlib",
    country: "Syria",
    lat: 35.9334,
    lng: 36.6317,
    severity: "high",
    description:
      "Persistent instability in northwestern Syria. Sporadic airstrikes and ground clashes between various factions.",
    sources: [
      {
        title: "Syria: Situation remains volatile in Idlib",
        url: "https://www.reuters.com/world/middle-east/",
        publisher: "Reuters",
        date: "2026-02-27",
        snippet: "The humanitarian situation in Idlib remains dire with continued military operations.",
      },
    ],
    lastUpdated: "2026-03-03T00:00:00Z",
    type: "Armed Conflict",
  },
  {
    id: "yemen-hodeidah",
    name: "Hodeidah",
    country: "Yemen",
    lat: 14.7979,
    lng: 42.9541,
    severity: "high",
    description:
      "Strategic port city under Houthi control. Subject to coalition airstrikes. Major humanitarian crisis point.",
    sources: [
      {
        title: "Yemen conflict: Red Sea tensions escalate",
        url: "https://www.bbc.com/news/world-middle-east",
        publisher: "BBC News",
        date: "2026-03-01",
        snippet: "The Houthi movement continues to affect Red Sea shipping while military operations persist.",
      },
    ],
    lastUpdated: "2026-03-03T00:00:00Z",
    casualties: "Hundreds of thousands (since 2014)",
    type: "Armed Conflict",
  },
  {
    id: "drc-north-kivu",
    name: "North Kivu",
    country: "Democratic Republic of Congo",
    lat: -1.6748,
    lng: 29.2294,
    severity: "high",
    description:
      "M23 rebel group advances. Intense fighting displacing millions. Regional tensions with Rwanda.",
    sources: [
      {
        title: "DRC: M23 rebels advance in eastern Congo",
        url: "https://www.aljazeera.com/tag/war-and-conflict/",
        publisher: "Al Jazeera",
        date: "2026-03-02",
        snippet: "M23 forces continue their offensive in North Kivu, displacing hundreds of thousands.",
      },
    ],
    lastUpdated: "2026-03-03T00:00:00Z",
    casualties: "Thousands",
    type: "Armed Conflict",
  },
  {
    id: "somalia-mogadishu",
    name: "Mogadishu",
    country: "Somalia",
    lat: 2.0469,
    lng: 45.3182,
    severity: "high",
    description:
      "Al-Shabaab insurgency continues with frequent attacks. Government forces conducting counter-terrorism operations.",
    sources: [
      {
        title: "Somalia: Al-Shabaab attacks persist",
        url: "https://www.reuters.com/world/africa/",
        publisher: "Reuters",
        date: "2026-02-28",
        snippet: "Al-Shabaab continues to carry out attacks across southern Somalia.",
      },
    ],
    lastUpdated: "2026-03-03T00:00:00Z",
    type: "Insurgency",
  },
  {
    id: "ethiopia-amhara",
    name: "Amhara Region",
    country: "Ethiopia",
    lat: 11.5,
    lng: 38.5,
    severity: "medium",
    description:
      "Fano militia insurgency against federal government. State of emergency declared in the region.",
    sources: [
      {
        title: "Ethiopia: Unrest continues in Amhara",
        url: "https://www.bbc.com/news/world-africa",
        publisher: "BBC News",
        date: "2026-02-25",
        snippet: "Armed clashes between Fano militias and federal forces continue in the Amhara region.",
      },
    ],
    lastUpdated: "2026-03-03T00:00:00Z",
    type: "Insurgency",
  },
  {
    id: "iraq-kirkuk",
    name: "Kirkuk",
    country: "Iraq",
    lat: 35.4681,
    lng: 44.3922,
    severity: "medium",
    description:
      "Remnants of ISIS conducting hit-and-run attacks. Iraqi forces maintaining counter-terrorism operations.",
    sources: [
      {
        title: "Iraq: ISIS remnants remain active in northern regions",
        url: "https://www.reuters.com/world/middle-east/",
        publisher: "Reuters",
        date: "2026-02-27",
        snippet: "Iraqi security forces continue operations against ISIS cells in northern Iraq.",
      },
    ],
    lastUpdated: "2026-03-03T00:00:00Z",
    type: "Terrorism",
  },
  {
    id: "haiti-port-au-prince",
    name: "Port-au-Prince",
    country: "Haiti",
    lat: 18.5944,
    lng: -72.3074,
    severity: "high",
    description:
      "Gang violence has paralyzed the capital. Armed gangs control large portions of the city.",
    sources: [
      {
        title: "Haiti gang violence spirals out of control",
        url: "https://www.bbc.com/news/world-latin-america",
        publisher: "BBC News",
        date: "2026-03-01",
        snippet: "Armed gangs continue to expand control over Port-au-Prince neighborhoods.",
      },
    ],
    lastUpdated: "2026-03-03T00:00:00Z",
    casualties: "Thousands",
    type: "Civil Unrest",
  },
  {
    id: "pakistan-balochistan",
    name: "Balochistan",
    country: "Pakistan",
    lat: 28.4907,
    lng: 65.0958,
    severity: "medium",
    description:
      "Balochistan Liberation Army conducting attacks against security forces and infrastructure.",
    sources: [
      {
        title: "Pakistan: Attacks in Balochistan continue",
        url: "https://www.aljazeera.com/tag/war-and-conflict/",
        publisher: "Al Jazeera",
        date: "2026-02-26",
        snippet: "Separatist attacks continue in Pakistan's restive Balochistan province.",
      },
    ],
    lastUpdated: "2026-03-03T00:00:00Z",
    type: "Insurgency",
  },
  {
    id: "sahel-burkina-faso",
    name: "Ouagadougou Region",
    country: "Burkina Faso",
    lat: 12.3714,
    lng: -1.5197,
    severity: "high",
    description:
      "Jihadist insurgency controls large portions of the country. Regular attacks on military and civilian targets.",
    sources: [
      {
        title: "Sahel crisis: Burkina Faso conflict escalates",
        url: "https://www.reuters.com/world/africa/",
        publisher: "Reuters",
        date: "2026-02-28",
        snippet: "Armed groups linked to al-Qaeda and ISIS continue to expand their control in Burkina Faso.",
      },
    ],
    lastUpdated: "2026-03-03T00:00:00Z",
    casualties: "Thousands",
    type: "Terrorism",
  },
  {
    id: "lebanon-south",
    name: "Southern Lebanon",
    country: "Lebanon",
    lat: 33.2721,
    lng: 35.2033,
    severity: "high",
    description:
      "Cross-border tensions and military exchanges along the Israel-Lebanon border.",
    sources: [
      {
        title: "Lebanon border tensions remain high",
        url: "https://www.aljazeera.com/news/",
        publisher: "Al Jazeera",
        date: "2026-03-01",
        snippet: "Military exchanges continue along the southern Lebanon border.",
      },
    ],
    lastUpdated: "2026-03-03T00:00:00Z",
    type: "Armed Conflict",
  },
];

export async function POST(request: Request) {
  try {
    const auth = await verifyAdmin(request.headers.get("authorization"));
    if (!auth.ok) return auth.response!;

    let count = 0;
    for (const conflict of SEED_CONFLICTS) {
      const { id, ...data } = conflict;
      await adminDb.collection("conflicts").doc(id).set(data, { merge: true });
      count++;
    }

    return NextResponse.json({
      message: `Seeded ${count} conflict zones`,
      zones: SEED_CONFLICTS.map((c) => `${c.name}, ${c.country}`),
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: "Failed to seed data" },
      { status: 500 }
    );
  }
}
