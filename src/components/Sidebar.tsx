"use client";

import { useEffect, useState, useCallback } from "react";
import type { ConflictZone } from "@/types";

interface SidebarProps {
  conflict: ConflictZone | null;
  isOpen: boolean;
  onClose: () => void;
}

const SEVERITY_STYLES = {
  critical: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400", badge: "bg-red-500", label: "CRITICAL" },
  high: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400", badge: "bg-orange-500", label: "HIGH" },
  medium: { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-400", badge: "bg-yellow-500", label: "MEDIUM" },
  low: { bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-400", badge: "bg-green-500", label: "LOW" },
};

export default function Sidebar({ conflict, isOpen, onClose }: SidebarProps) {
  const [history, setHistory] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(false);
  const [historyCache, setHistoryCache] = useState<Record<string, string>>({});

  const fetchHistory = useCallback(async (conflictId: string) => {
    // Check local cache first
    if (historyCache[conflictId]) {
      setHistory(historyCache[conflictId]);
      return;
    }
    setHistoryLoading(true);
    setHistoryError(false);
    try {
      const res = await fetch(`/api/conflicts/${conflictId}/history`);
      if (res.ok) {
        const data = await res.json();
        const ctx = data.historicalContext || null;
        setHistory(ctx);
        if (ctx) {
          setHistoryCache((prev) => ({ ...prev, [conflictId]: ctx }));
        }
      } else {
        setHistoryError(true);
      }
    } catch {
      setHistoryError(true);
    } finally {
      setHistoryLoading(false);
    }
  }, [historyCache]);

  // Fetch history lazily when a conflict is opened
  useEffect(() => {
    if (conflict && isOpen) {
      // 1. Check if already on the conflict object (from Firestore)
      if (conflict.historicalContext) {
        setHistory(conflict.historicalContext);
        setHistoryLoading(false);
        setHistoryError(false);
      // 2. Check local in-memory cache
      } else if (historyCache[conflict.id]) {
        setHistory(historyCache[conflict.id]);
        setHistoryLoading(false);
        setHistoryError(false);
      // 3. Fetch from API (will check Firestore cache, then generate if needed)
      } else {
        setHistory(null);
        fetchHistory(conflict.id);
      }
    } else {
      setHistory(null);
      setHistoryLoading(false);
      setHistoryError(false);
    }
  }, [conflict, isOpen, fetchHistory, historyCache]);

  if (!conflict) return null;

  const style = SEVERITY_STYLES[conflict.severity];
  const lastUpdated = new Date(conflict.lastUpdated);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{ zIndex: 1000 }}
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <aside
        role="complementary"
        aria-label={`Conflict details: ${conflict.name}, ${conflict.country}`}
        className={`absolute right-0 top-0 bottom-0 w-full sm:w-[420px] sm:max-w-[90vw] bg-[#0f0f1a]/95 backdrop-blur-xl border-l border-zinc-800/50 transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } overflow-y-auto overscroll-contain`}
        style={{ zIndex: 1001, WebkitOverflowScrolling: "touch" }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-700/50 active:bg-zinc-600/50 transition-all z-10"
          aria-label="Close sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-start gap-3 mb-3">
              <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-widest uppercase ${style.badge} text-white`}>
                {style.label}
              </div>
              <div className={`px-2.5 py-1 rounded-md text-[10px] font-medium tracking-wider uppercase ${style.bg} ${style.text} border ${style.border}`}>
                {conflict.type}
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight pr-10">
              {conflict.name}
            </h2>
            <p className="text-zinc-400 text-sm mt-1 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {conflict.country}
            </p>
          </div>

          {/* Description */}
          <div className={`p-4 rounded-xl ${style.bg} border ${style.border}`}>
            <p className="text-zinc-300 text-sm leading-relaxed">
              {conflict.description}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-3">
              <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Coordinates</p>
              <p className="text-zinc-300 text-sm font-mono">
                {conflict.lat.toFixed(4)}°, {conflict.lng.toFixed(4)}°
              </p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-3">
              <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Last Updated</p>
              <p className="text-zinc-300 text-sm">
                {lastUpdated.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>
            {conflict.casualties && (
              <div className="col-span-2 bg-red-950/30 border border-red-900/30 rounded-xl p-3">
                <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Estimated Casualties</p>
                <p className="text-red-400 text-sm font-semibold">{conflict.casualties}</p>
              </div>
            )}
          </div>

          {/* Historical Context */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12,6 12,12 16,14" />
              </svg>
              Historical Context
            </h3>

            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4">
              {historyLoading ? (
                <div className="flex items-center gap-3 py-2">
                  <div className="w-4 h-4 border-2 border-amber-500/30 rounded-full animate-spin border-t-amber-500" />
                  <p className="text-zinc-500 text-sm">Generating historical analysis...</p>
                </div>
              ) : historyError ? (
                <div className="flex items-center justify-between">
                  <p className="text-zinc-500 text-sm">Failed to load historical context</p>
                  <button
                    onClick={() => fetchHistory(conflict.id)}
                    className="text-amber-400 text-xs hover:text-amber-300 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : history ? (
                <div className="text-zinc-400 text-sm leading-relaxed space-y-3">
                  {history.split(/\n\n|\n(?=\*\*)/).map((section, i) => {
                    const headerMatch = section.match(/^\*\*(.+?)\*\*/);
                    if (headerMatch) {
                      const headerText = headerMatch[1];
                      const body = section.replace(/^\*\*.+?\*\*\s*\n?/, "").trim();
                      return (
                        <div key={i}>
                          <p className="text-amber-400/80 text-xs font-semibold uppercase tracking-wider mb-1">
                            {headerText}
                          </p>
                          <p className="text-zinc-400 text-sm leading-relaxed">{body}</p>
                        </div>
                      );
                    }
                    return section.trim() ? (
                      <p key={i} className="text-zinc-400 text-sm leading-relaxed">{section.trim()}</p>
                    ) : null;
                  })}
                </div>
              ) : (
                <p className="text-zinc-600 text-sm">No historical data available</p>
              )}
            </div>
          </div>

          {/* Sources */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14,2 14,8 20,8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              Official Sources
            </h3>

            <div className="space-y-3">
              {conflict.sources.map((source, i) => (
                <a
                  key={i}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group"
                >
                  <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4 hover:border-red-500/30 hover:bg-zinc-900/80 transition-all duration-200">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-zinc-200 text-sm font-medium leading-snug group-hover:text-red-400 transition-colors line-clamp-2">
                          {source.title}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                            {source.publisher}
                          </span>
                          <span className="text-zinc-600 text-[10px]">
                            {new Date(source.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        {source.snippet && (
                          <p className="text-zinc-500 text-xs mt-2 line-clamp-2 leading-relaxed">
                            {source.snippet}
                          </p>
                        )}
                      </div>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4 text-zinc-600 group-hover:text-red-400 flex-shrink-0 mt-1 transition-colors"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                        <polyline points="15,3 21,3 21,9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-zinc-800/50 pt-4">
            <p className="text-zinc-600 text-[10px] text-center uppercase tracking-widest">
              Data sourced from international news agencies
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
