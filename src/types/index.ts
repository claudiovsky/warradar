export interface ConflictZone {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  sources: Source[];
  lastUpdated: string; // ISO date
  casualties?: string;
  type: string; // e.g. "Armed Conflict", "Terrorism", "Civil Unrest"
  historicalContext?: string; // AI-generated historical background, loaded lazily
}

export interface Source {
  title: string;
  url: string;
  publisher: string;
  date: string;
  snippet: string;
}

export interface ScrapedArticle {
  title: string;
  url: string;
  publisher: string;
  date: string;
  content: string;
}

export interface AIAnalysis {
  location: string;
  country: string;
  lat: number;
  lng: number;
  severity: "critical" | "high" | "medium" | "low";
  type: string;
  summary: string;
  casualties?: string;
}
