"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ConflictZone } from "@/types";

const SEVERITY_STYLES = {
  critical: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400", dot: "bg-red-500" },
  high: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400", dot: "bg-orange-500" },
  medium: { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-400", dot: "bg-yellow-500" },
  low: { bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-400", dot: "bg-green-500" },
};

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [conflicts, setConflicts] = useState<ConflictZone[]>([]);
  const [scrapeStatus, setScrapeStatus] = useState<string | null>(null);
  const [scraping, setScraping] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const router = useRouter();

  // Auth check
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
      } else {
        router.push("/admin");
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, [router]);

  // Fetch conflicts
  useEffect(() => {
    if (user) fetchConflicts();
  }, [user]);

  async function fetchConflicts() {
    try {
      const res = await fetch("/api/conflicts");
      const data = await res.json();
      setConflicts(data.conflicts || []);
    } catch {
      console.error("Failed to fetch conflicts");
    }
  }

  async function handleScrape() {
    if (!user) return;
    setScraping(true);
    setScrapeStatus(null);

    try {
      const token = await user.getIdToken();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 290000); // 290s client timeout (Vercel Pro)

      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      // Handle non-JSON responses (e.g. Vercel gateway timeout)
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const text = await res.text();
        setScrapeStatus(`❌ Server error (${res.status}): ${text.slice(0, 100)}`);
        return;
      }

      const data = await res.json();

      if (res.ok) {
        setScrapeStatus(
          `✅ Scraped ${data.articlesScraped} articles → ${data.conflictsUpdated} zones updated`
        );
        await fetchConflicts();
      } else {
        setScrapeStatus(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setScrapeStatus("❌ Request timed out (>55s). The scrape may still be running on the server. Try refreshing in a minute.");
      } else {
        setScrapeStatus(`❌ Network error: ${err instanceof Error ? err.message : "Unknown"}`);
      }
    } finally {
      setScraping(false);
    }
  }

  async function handleDelete(conflictId: string) {
    if (!user) return;
    if (!confirm("Are you sure you want to remove this conflict zone?")) return;

    setDeleting(conflictId);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/conflicts/${conflictId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setConflicts((prev) => prev.filter((c) => c.id !== conflictId));
      } else {
        const data = await res.json();
        alert(`Failed to delete: ${data.error}`);
      }
    } catch {
      alert("Network error during deletion");
    } finally {
      setDeleting(null);
    }
  }

  async function handleSeed() {
    if (!user) return;
    if (!confirm("Seed the database with initial conflict data?")) return;
    setScrapeStatus("Seeding...");
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/seed", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setScrapeStatus(`✅ ${data.message}`);
      await fetchConflicts();
    } catch {
      setScrapeStatus("❌ Seed failed");
    }
  }

  async function handleLogout() {
    await signOut(auth);
    router.push("/admin");
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-red-500/30 rounded-full animate-spin border-t-red-500" />
      </div>
    );
  }

  if (!user) return null;

  const critical = conflicts.filter((c) => c.severity === "critical").length;
  const high = conflicts.filter((c) => c.severity === "high").length;
  const medium = conflicts.filter((c) => c.severity === "medium").length;
  const low = conflicts.filter((c) => c.severity === "low").length;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-zinc-200">
      {/* Top Bar */}
      <header
        className="bg-[#0d0d14] border-b border-zinc-800/50 flex flex-wrap items-center justify-between sticky top-0 z-50 gap-2"
        style={{ padding: "12px 16px" }}
      >
        <div className="flex items-center" style={{ gap: 12 }}>
          <div
            className="bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ width: 32, height: 32 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: "0.06em", lineHeight: 1 }}>
              WAR-<span style={{ color: "#ef4444" }}>RADAR</span>
              <span style={{ color: "#71717a", fontSize: 11, fontWeight: 400, marginLeft: 6 }}>Admin</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center flex-wrap" style={{ gap: 10 }}>
          <Link
            href="/"
            style={{ color: "#71717a", fontSize: 13, textDecoration: "none" }}
            className="hover:text-zinc-300 transition-colors"
          >
            ← Map
          </Link>
          <span className="hidden sm:inline" style={{ color: "#52525b", fontSize: 12 }}>{user.email}</span>
          <button
            onClick={handleLogout}
            style={{
              background: "#27272a",
              color: "#d4d4d8",
              fontSize: 13,
              padding: "6px 14px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 12px" }}
        className="sm:px-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 sm:grid-cols-5" style={{ gap: 10, marginBottom: 24 }}>
          <div style={{ background: "#0f0f1a", border: "1px solid rgba(39,39,42,0.5)", borderRadius: 14, padding: 14 }}>
            <p style={{ color: "#71717a", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}>Total</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginTop: 4 }}>{conflicts.length}</p>
          </div>
          <div style={{ background: "#0f0f1a", border: "1px solid rgba(127,29,29,0.3)", borderRadius: 14, padding: 14 }}>
            <p style={{ color: "#71717a", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}>Critical</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: "#f87171", marginTop: 4 }}>{critical}</p>
          </div>
          <div style={{ background: "#0f0f1a", border: "1px solid rgba(154,52,18,0.3)", borderRadius: 14, padding: 14 }}>
            <p style={{ color: "#71717a", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}>High</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: "#fb923c", marginTop: 4 }}>{high}</p>
          </div>
          <div className="hidden sm:block" style={{ background: "#0f0f1a", border: "1px solid rgba(133,77,14,0.3)", borderRadius: 14, padding: 14 }}>
            <p style={{ color: "#71717a", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}>Medium</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: "#facc15", marginTop: 4 }}>{medium}</p>
          </div>
          <div className="hidden sm:block" style={{ background: "#0f0f1a", border: "1px solid rgba(22,101,52,0.3)", borderRadius: 14, padding: 14 }}>
            <p style={{ color: "#71717a", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}>Low</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: "#4ade80", marginTop: 4 }}>{low}</p>
          </div>
        </div>

        {/* Actions */}
        <div style={{ background: "#0f0f1a", border: "1px solid rgba(39,39,42,0.5)", borderRadius: 14, padding: "16px", marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 12 }}>Actions</h2>
          <div className="flex flex-wrap" style={{ gap: 10 }}>
            {/* SCAN BUTTON */}
            <button
              onClick={handleScrape}
              disabled={scraping}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-900 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-red-600/20 flex items-center gap-2 text-sm"
            >
              <svg
                className={`w-5 h-5 ${scraping ? "animate-spin" : ""}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
              {scraping ? "Scanning news sources..." : "🔴 Scan & Update News"}
            </button>

            <button
              onClick={handleSeed}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Seed Initial Data
            </button>

            <button
              onClick={fetchConflicts}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
              Refresh
            </button>
          </div>

          {/* Status message */}
          {scrapeStatus && (
            <div className={`mt-4 px-4 py-3 rounded-xl text-sm ${
              scrapeStatus.startsWith("✅")
                ? "bg-green-500/10 border border-green-500/30 text-green-400"
                : scrapeStatus.startsWith("❌")
                ? "bg-red-500/10 border border-red-500/30 text-red-400"
                : "bg-zinc-800 border border-zinc-700 text-zinc-300"
            }`}>
              {scrapeStatus}
            </div>
          )}
        </div>

        {/* Conflicts Table */}
        <div className="bg-[#0f0f1a] border border-zinc-800/50 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800/50">
            <h2 className="text-lg font-semibold text-white">
              Conflict Zones ({conflicts.length})
            </h2>
          </div>

          {conflicts.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-zinc-500 text-lg">No conflict zones yet</p>
              <p className="text-zinc-600 text-sm mt-2">
                Click &quot;Seed Initial Data&quot; or &quot;Scan &amp; Update News&quot; to populate
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/30">
              {conflicts.map((conflict) => {
                const style = SEVERITY_STYLES[conflict.severity];
                return (
                  <div
                    key={conflict.id}
                    className="px-3 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between hover:bg-zinc-900/30 transition-colors group gap-2"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className={`w-3 h-3 rounded-full ${style.dot} flex-shrink-0 shadow-sm`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-white font-medium text-sm truncate">{conflict.name}</h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded ${style.bg} ${style.text} ${style.border} border uppercase tracking-wider font-semibold`}>
                            {conflict.severity}
                          </span>
                        </div>
                        <p className="text-zinc-500 text-xs truncate mt-0.5">
                          {conflict.country} — {conflict.description.slice(0, 80)}...
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 ml-6 sm:ml-4">
                      <span className="text-zinc-600 text-xs">
                        {conflict.sources.length} src{conflict.sources.length !== 1 ? "s" : ""}
                      </span>
                      <span className="text-zinc-700 text-xs">
                        {new Date(conflict.lastUpdated).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <button
                        onClick={() => handleDelete(conflict.id)}
                        disabled={deleting === conflict.id}
                        className="sm:opacity-0 sm:group-hover:opacity-100 bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 border border-red-500/30 text-red-400 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                      >
                        {deleting === conflict.id ? "..." : "Remove"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
