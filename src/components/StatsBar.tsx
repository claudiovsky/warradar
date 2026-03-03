"use client";

import type { ConflictZone } from "@/types";

interface StatsBarProps {
  conflicts: ConflictZone[];
}

export default function StatsBar({ conflicts }: StatsBarProps) {
  const critical = conflicts.filter((c) => c.severity === "critical").length;
  const high = conflicts.filter((c) => c.severity === "high").length;
  const medium = conflicts.filter((c) => c.severity === "medium").length;
  const low = conflicts.filter((c) => c.severity === "low").length;

  const countries = [...new Set(conflicts.map((c) => c.country))];

  return (
    <div
      className="border-b border-zinc-800/30 flex items-center overflow-x-auto"
      style={{
        background: "rgba(13,13,20,0.92)",
        padding: "5px 12px",
        gap: 12,
        fontSize: 11,
        whiteSpace: "nowrap",
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      {/* Severity counts — always visible */}
      <div className="flex items-center" style={{ gap: 10 }}>
        <span className="flex items-center" style={{ gap: 4 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#ef4444", boxShadow: "0 0 4px rgba(239,68,68,0.5)", flexShrink: 0 }} />
          <span className="hidden sm:inline" style={{ color: "#a1a1aa" }}>Critical</span>
          <span style={{ color: "#f87171", fontWeight: 700 }}>{critical}</span>
        </span>
        <span className="flex items-center" style={{ gap: 4 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#f97316", boxShadow: "0 0 4px rgba(249,115,22,0.5)", flexShrink: 0 }} />
          <span className="hidden sm:inline" style={{ color: "#a1a1aa" }}>High</span>
          <span style={{ color: "#fb923c", fontWeight: 700 }}>{high}</span>
        </span>
        <span className="flex items-center" style={{ gap: 4 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#eab308", boxShadow: "0 0 4px rgba(234,179,8,0.4)", flexShrink: 0 }} />
          <span className="hidden sm:inline" style={{ color: "#a1a1aa" }}>Medium</span>
          <span style={{ color: "#facc15", fontWeight: 700 }}>{medium}</span>
        </span>
        <span className="flex items-center" style={{ gap: 4 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 4px rgba(34,197,94,0.4)", flexShrink: 0 }} />
          <span className="hidden sm:inline" style={{ color: "#a1a1aa" }}>Low</span>
          <span style={{ color: "#4ade80", fontWeight: 700 }}>{low}</span>
        </span>
      </div>

      <span className="hidden sm:inline" style={{ color: "#3f3f46", fontSize: 14 }}>|</span>

      <span className="hidden sm:inline" style={{ color: "#71717a" }}>
        <span style={{ color: "#a1a1aa", fontWeight: 600 }}>{countries.length}</span> countries
      </span>

      {/* Live indicator */}
      <span
        className="flex items-center"
        style={{ marginLeft: "auto", gap: 5, color: "#52525b", flexShrink: 0 }}
      >
        <span
          className="animate-pulse"
          style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }}
        />
        <span className="hidden sm:inline">Live Monitoring</span>
        <span className="sm:hidden">Live</span>
      </span>
    </div>
  );
}
