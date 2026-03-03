"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { ConflictZone } from "@/types";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import StatsBar from "@/components/StatsBar";
import LoadingScreen from "@/components/LoadingScreen";
import CollaborateModal from "@/components/CollaborateModal";
import AnimatedFavicon from "@/components/AnimatedFavicon";

// Leaflet must be loaded client-side only
const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => <LoadingScreen />,
});

export default function Home() {
  const [conflicts, setConflicts] = useState<ConflictZone[]>([]);
  const [selectedConflict, setSelectedConflict] = useState<ConflictZone | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [collaborateOpen, setCollaborateOpen] = useState(false);

  useEffect(() => {
    fetchConflicts();
  }, []);

  async function fetchConflicts() {
    try {
      const res = await fetch("/api/conflicts");
      const data = await res.json();
      setConflicts(data.conflicts || []);
    } catch (err) {
      console.error("Failed to fetch conflicts:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleMarkerClick(conflict: ConflictZone) {
    setSelectedConflict(conflict);
    setSidebarOpen(true);
  }

  const filteredConflicts = conflicts.filter((c) => {
    const matchesSeverity = filterSeverity === "all" || c.severity === filterSeverity;
    const matchesSearch =
      searchQuery === "" ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  if (loading) return <LoadingScreen />;

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0a0a0f] overflow-hidden">
      <AnimatedFavicon />
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterSeverity={filterSeverity}
        setFilterSeverity={setFilterSeverity}
        totalConflicts={conflicts.length}
      />

      <StatsBar conflicts={conflicts} />

      <main role="main" aria-label="Interactive conflict zone map" className="flex flex-1 relative overflow-hidden">
        <MapView
          conflicts={filteredConflicts}
          onMarkerClick={handleMarkerClick}
          selectedConflict={selectedConflict}
        />

        <Sidebar
          conflict={selectedConflict}
          isOpen={sidebarOpen}
          onClose={() => {
            setSidebarOpen(false);
            setSelectedConflict(null);
          }}
        />
      </main>

      <noscript>
        <div style={{ padding: 40, textAlign: "center", color: "#e4e4e7", background: "#0a0a0f" }}>
          <h1>WAR-RADAR — Global Conflict Monitor</h1>
          <p>JavaScript is required to view the interactive conflict map. Please enable JavaScript in your browser settings.</p>
        </div>
      </noscript>

      {/* Collaborate CTA */}
      <button
        onClick={() => setCollaborateOpen(true)}
        className="fixed bottom-3 left-3 z-[999] text-zinc-600 hover:text-zinc-400 transition-colors text-[10px] tracking-wide"
        style={{ background: "none", border: "none", cursor: "pointer" }}
      >
        Become a contributor →
      </button>

      <CollaborateModal
        isOpen={collaborateOpen}
        onClose={() => setCollaborateOpen(false)}
      />
    </div>
  );
}
