<div align="center">

# 🔴 WAR-RADAR

**Real-time global war & armed conflict monitor**

[![CI](https://github.com/claudiovsky/warradar/actions/workflows/ci.yml/badge.svg)](https://github.com/claudiovsky/warradar/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

An interactive world map that tracks active wars and armed conflicts worldwide using AI-powered news analysis from multiple sources.

[Live Demo](https://war-radar.com) · [Report Bug](https://github.com/claudiovsky/warradar/issues) · [Request Feature](https://github.com/claudiovsky/warradar/issues) · [Contributing](CONTRIBUTING.md)

</div>

---

## Overview

WAR-RADAR is a full-stack web application that automatically scrapes, analyzes, and visualizes active war zones around the world. It aggregates news from 15+ RSS feeds, NewsAPI, and GDELT, uses OpenAI to extract conflict data with city-level precision, and displays it on a dark-themed interactive map with severity-coded pulsing markers.

**This project was built as a technical exercise** — a way to push the boundaries of a modern web stack (Next.js, AI, real-time data pipelines) while producing something meaningful. It is not affiliated with any organization.

## Features

- **Interactive Dark Map** — Leaflet with CartoDB dark tiles, pulsing severity markers (critical/high/medium/low)
- **AI-Powered Analysis** — GPT-4o-mini extracts conflict zones, cities, coordinates, and severity from raw news
- **Multi-Source Scraping** — RSS feeds (Al Jazeera, BBC, Guardian, etc.), NewsAPI, GDELT API
- **City-Level Precision** — AI identifies specific cities, not just countries. Automatic geocoding fallback
- **Historical Context** — 3-level cache (in-memory → Firestore → AI generation) for each conflict zone
- **Admin Dashboard** — Protected panel to trigger scrapes, manage zones, view stats
- **Automated Updates** — Vercel cron job for daily scheduled scraping
- **Collaboration Form** — Built-in contact form with SMTP email delivery
- **Fully Responsive** — Optimized for desktop, tablet, and mobile
- **SEO Optimized** — OpenGraph images, JSON-LD, sitemap, robots.txt, meta tags

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Map | Leaflet + React-Leaflet |
| Database | Firebase Firestore |
| Auth | Firebase Authentication |
| AI | OpenAI GPT-4o-mini |
| Scraping | RSS Parser, Axios, NewsAPI, GDELT |
| Email | Nodemailer |
| Deployment | Vercel |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Client (React)                                     │
│  ├── Interactive Map (Leaflet + pulsing markers)    │
│  ├── Sidebar (conflict details + sources)           │
│  ├── Search & Filters                               │
│  └── Admin Dashboard                                │
├─────────────────────────────────────────────────────┤
│  API Routes (Next.js)                               │
│  ├── /api/scrape ──→ RSS + NewsAPI + GDELT          │
│  ├── /api/conflicts ──→ Firestore CRUD              │
│  ├── /api/cron/scrape ──→ Scheduled pipeline        │
│  └── /api/collaborate ──→ SMTP email                │
├─────────────────────────────────────────────────────┤
│  AI Pipeline                                        │
│  ├── Article chunking (40/chunk, parallel)           │
│  ├── GPT-4o-mini conflict extraction                │
│  ├── Deduplication by location + country            │
│  └── Geocoding fallback (AI batch)                  │
├─────────────────────────────────────────────────────┤
│  Data Layer                                         │
│  ├── Firestore (conflicts, history cache)           │
│  └── In-memory cache (historical context)           │
└─────────────────────────────────────────────────────┘
```

## Getting Started

### Prerequisites

- Node.js 18+
- Firebase project with Firestore enabled
- OpenAI API key
- *(Optional)* NewsAPI key, SMTP server

### Installation

```bash
# Clone the repository
git clone https://github.com/claudiovsky/warradar.git
cd warradar

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local with your API keys (see below)

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_*` | Yes | Firebase client config (6 values) |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Yes | Firebase Admin SDK JSON key |
| `OPENAI_API_KEY` | Yes | OpenAI API key for conflict analysis |
| `NEWS_API_KEY` | No | NewsAPI.org key (more sources) |
| `NEXT_PUBLIC_SITE_URL` | No | Production URL |
| `ADMIN_EMAIL` | Yes | Email allowed to access admin dashboard |
| `CONTACT_EMAIL` | No | Recipient for collaboration form |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | No | SMTP config for email delivery |
| `CRON_SECRET` | No | Protects the `/api/cron/scrape` endpoint |

### Deployment (Vercel)

1. Push to GitHub
2. Import in [Vercel](https://vercel.com)
3. Add all environment variables in Vercel dashboard
4. Deploy — cron job activates automatically via `vercel.json`

## Project Structure

```
src/
├── app/
│   ├── admin/              # Admin login + dashboard
│   ├── api/
│   │   ├── collaborate/    # Contact form endpoint
│   │   ├── conflicts/      # CRUD + historical context
│   │   ├── cron/scrape/    # Vercel cron endpoint
│   │   ├── scrape/         # Manual scrape trigger
│   │   └── seed/           # Initial data seeding
│   ├── layout.tsx          # Root layout, metadata, SEO
│   └── page.tsx            # Main map page
├── components/
│   ├── MapView.tsx         # Leaflet map + markers
│   ├── Sidebar.tsx         # Conflict detail panel
│   ├── Header.tsx          # Search, stats, navigation
│   ├── StatsBar.tsx        # Live conflict counters
│   ├── CollaborateModal.tsx # Contact form modal
│   └── AnimatedFavicon.tsx  # Canvas-based favicon
├── lib/
│   ├── scraper.ts          # RSS + NewsAPI + GDELT
│   ├── ai-analyzer.ts      # OpenAI conflict extraction
│   ├── firebase.ts         # Client-side Firebase
│   ├── firebase-admin.ts   # Server-side Firebase Admin
│   ├── auth.ts             # Admin verification
│   └── history-cache.ts    # 3-level context cache
└── types/
    └── index.ts            # TypeScript interfaces
```

## Scripts

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
```

## Performance

The scraping pipeline is optimized to run within Vercel's 60-second serverless function limit:

- All RSS feeds fetched in parallel (5s timeout each)
- NewsAPI queries in a single parallel batch
- AI analysis in concurrent chunk pairs
- Firestore batch writes
- 50-second timeout guard with graceful fallback

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md).

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Map tiles by [CartoDB](https://carto.com/)
- News data from [NewsAPI](https://newsapi.org/), [GDELT](https://www.gdeltproject.org/), and various RSS feeds
- AI analysis powered by [OpenAI](https://openai.com/)
- Built with [Next.js](https://nextjs.org/), [Leaflet](https://leafletjs.com/), [Firebase](https://firebase.google.com/)
