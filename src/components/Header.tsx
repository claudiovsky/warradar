"use client";

import { useState } from "react";

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterSeverity: string;
  setFilterSeverity: (s: string) => void;
  totalConflicts: number;
}

export default function Header({
  searchQuery,
  setSearchQuery,
  filterSeverity,
  setFilterSeverity,
  totalConflicts,
}: HeaderProps) {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <header
      role="banner"
      aria-label="WAR-RADAR navigation and conflict filters"
      className="bg-[#0d0d14] border-b border-zinc-800/50 z-50"
    >
      {/* Main row */}
      <div
        className="flex items-center justify-between"
        style={{ padding: "10px 12px" }}
      >
        {/* Logo */}
        <div className="flex items-center" style={{ gap: "10px" }}>
          <div className="relative flex-shrink-0">
            <div
              className="bg-red-600 rounded-lg flex items-center justify-center"
              style={{ width: 34, height: 34 }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <span
              className="absolute bg-red-500 rounded-full animate-pulse"
              style={{ width: 8, height: 8, top: -2, right: -2 }}
            />
          </div>
          <div>
            <h1
              className="font-bold text-white tracking-wider"
              style={{ fontSize: 16, lineHeight: 1 }}
            >
              WAR-<span className="text-red-500">RADAR</span>
            </h1>
            <p
              className="text-zinc-500 uppercase hidden sm:block"
              style={{ fontSize: 8, letterSpacing: "0.15em", marginTop: 2 }}
            >
              Global Conflict Monitor
            </p>
          </div>
        </div>

        {/* Desktop: Search & Filters — hidden on mobile */}
        <div className="hidden md:flex items-center" style={{ gap: 10 }}>
          {/* Search */}
          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#71717a"
              strokeWidth="2"
              style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              aria-label="Search conflict zones by name, country, or type"
              placeholder="Search conflicts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: 200,
                height: 34,
                paddingLeft: 34,
                paddingRight: 12,
                fontSize: 13,
                borderRadius: 8,
                border: "1px solid rgba(63,63,70,0.5)",
                background: "rgba(24,24,27,0.8)",
                color: "#e4e4e7",
                outline: "none",
              }}
              className="placeholder-zinc-600 focus:border-red-500/50"
            />
          </div>

          {/* Severity Filter */}
          <div className="relative">
            <select
              aria-label="Filter conflicts by severity level"
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              style={{
                height: 34,
                paddingLeft: 12,
                paddingRight: 28,
                fontSize: 13,
                borderRadius: 8,
                border: "1px solid rgba(63,63,70,0.5)",
                background: "rgba(24,24,27,0.8)",
                color: "#d4d4d8",
                outline: "none",
                cursor: "pointer",
                WebkitAppearance: "none",
                appearance: "none" as const,
              }}
            >
              <option value="all">All Severity</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#71717a"
              strokeWidth="2"
              style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>

          {/* Count Badge */}
          <div
            className="flex-shrink-0"
            style={{
              background: "rgba(24,24,27,0.9)",
              border: "1px solid #27272a",
              borderRadius: 8,
              height: 34,
              padding: "0 12px",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <span className="text-red-500 font-bold" style={{ fontSize: 16, lineHeight: 1 }}>
              {totalConflicts}
            </span>
            <span className="text-zinc-500 uppercase" style={{ fontSize: 9, letterSpacing: "0.1em" }}>
              Zones
            </span>
          </div>

          {/* Buy Me a Coffee */}
          <a
            href="https://buymeacoffee.com/claudios"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 flex items-center transition-all hover:scale-105"
            title="Support this project"
            style={{
              background: "#FFDD00",
              color: "#000",
              fontWeight: 700,
              fontSize: 12,
              height: 34,
              padding: "0 12px",
              borderRadius: 8,
              textDecoration: "none",
              gap: 5,
            }}
          >
            ☕ Donate
          </a>

          {/* Admin Link */}
          <a
            href="/admin"
            className="flex-shrink-0 text-zinc-600 hover:text-zinc-300 transition-colors"
            title="Admin Panel"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </a>
        </div>

        {/* Mobile: compact icons row */}
        <div className="flex md:hidden items-center" style={{ gap: 8 }}>
          {/* Count Badge (compact) */}
          <div
            style={{
              background: "rgba(24,24,27,0.9)",
              border: "1px solid #27272a",
              borderRadius: 8,
              height: 34,
              padding: "0 10px",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span className="text-red-500 font-bold" style={{ fontSize: 15, lineHeight: 1 }}>
              {totalConflicts}
            </span>
            <span className="text-zinc-500 uppercase" style={{ fontSize: 8 }}>
              Zones
            </span>
          </div>

          {/* Search toggle */}
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: mobileSearchOpen ? "rgba(239,68,68,0.15)" : "rgba(24,24,27,0.8)",
              border: `1px solid ${mobileSearchOpen ? "rgba(239,68,68,0.3)" : "rgba(63,63,70,0.5)"}`,
            }}
            aria-label="Toggle search"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileSearchOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </>
              )}
            </svg>
          </button>

          {/* Donate (icon only) */}
          <a
            href="https://buymeacoffee.com/claudios"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center"
            title="Support this project"
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: "#FFDD00",
              fontSize: 16,
              textDecoration: "none",
            }}
          >
            ☕
          </a>

          {/* Admin Link */}
          <a
            href="/admin"
            className="flex-shrink-0 text-zinc-600 hover:text-zinc-300 transition-colors flex items-center justify-center"
            title="Admin Panel"
            style={{ width: 34, height: 34 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </a>
        </div>
      </div>

      {/* Mobile expanded search/filter row */}
      {mobileSearchOpen && (
        <div
          className="md:hidden flex items-center border-t border-zinc-800/50"
          style={{ padding: "8px 12px", gap: 8 }}
        >
          <div className="relative flex-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#71717a"
              strokeWidth="2"
              style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              aria-label="Search conflict zones"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              style={{
                width: "100%",
                height: 36,
                paddingLeft: 34,
                paddingRight: 12,
                fontSize: 14,
                borderRadius: 8,
                border: "1px solid rgba(63,63,70,0.5)",
                background: "rgba(24,24,27,0.8)",
                color: "#e4e4e7",
                outline: "none",
              }}
              className="placeholder-zinc-600 focus:border-red-500/50"
            />
          </div>

          <div className="relative flex-shrink-0">
            <select
              aria-label="Filter by severity"
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              style={{
                height: 36,
                paddingLeft: 10,
                paddingRight: 28,
                fontSize: 13,
                borderRadius: 8,
                border: "1px solid rgba(63,63,70,0.5)",
                background: "rgba(24,24,27,0.8)",
                color: "#d4d4d8",
                outline: "none",
                cursor: "pointer",
                WebkitAppearance: "none",
                appearance: "none" as const,
              }}
            >
              <option value="all">All</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#71717a"
              strokeWidth="2"
              style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      )}
    </header>
  );
}
