"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { ConflictZone } from "@/types";

interface MapViewProps {
  conflicts: ConflictZone[];
  onMarkerClick: (conflict: ConflictZone) => void;
  selectedConflict: ConflictZone | null;
}

const SEVERITY_CONFIG = {
  critical: {
    color: "#ef4444",
    pulseColor: "rgba(239, 68, 68, 0.3)",
    radius: 18,
    pulseRadius: 35,
    zIndex: 1000,
  },
  high: {
    color: "#f97316",
    pulseColor: "rgba(249, 115, 22, 0.25)",
    radius: 14,
    pulseRadius: 28,
    zIndex: 900,
  },
  medium: {
    color: "#eab308",
    pulseColor: "rgba(234, 179, 8, 0.2)",
    radius: 11,
    pulseRadius: 22,
    zIndex: 800,
  },
  low: {
    color: "#22c55e",
    pulseColor: "rgba(34, 197, 94, 0.15)",
    radius: 8,
    pulseRadius: 16,
    zIndex: 700,
  },
};

function createPulsingIcon(severity: ConflictZone["severity"], scale = 1) {
  const config = SEVERITY_CONFIG[severity];
  const r = Math.round(config.radius * scale);
  const pr = Math.round(config.pulseRadius * scale);
  const pr14 = Math.round(pr * 1.4);

  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="position:relative;width:${pr * 2}px;height:${pr * 2}px;display:flex;align-items:center;justify-content:center;cursor:pointer;">
        <div style="
          position:absolute;
          width:${pr * 2}px;
          height:${pr * 2}px;
          border-radius:50%;
          background:${config.pulseColor};
          animation: pulse-ring 2s ease-out infinite;
          pointer-events:none;
        "></div>
        <div style="
          position:absolute;
          width:${pr14}px;
          height:${pr14}px;
          border-radius:50%;
          background:${config.pulseColor};
          animation: pulse-ring 2s ease-out infinite 0.5s;
          pointer-events:none;
        "></div>
        <div style="
          position:relative;
          width:${r}px;
          height:${r}px;
          border-radius:50%;
          background:${config.color};
          border: 2px solid rgba(255,255,255,0.8);
          box-shadow: 0 0 15px ${config.color}80, 0 0 30px ${config.color}40;
          z-index:2;
          cursor:pointer;
          transition: transform 0.2s;
        "></div>
      </div>
    `,
    iconSize: [pr * 2, pr * 2],
    iconAnchor: [pr, pr],
  });
}

export default function MapView({ conflicts, onMarkerClick, selectedConflict }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Inject pulse animation CSS
    const style = document.createElement("style");
    style.textContent = `
      @keyframes pulse-ring {
        0% { transform: scale(0.5); opacity: 1; }
        100% { transform: scale(1.5); opacity: 0; }
      }
      .custom-marker { background: none !important; border: none !important; }
      .leaflet-popup-content-wrapper {
        background: #1a1a2e !important;
        color: #e4e4e7 !important;
        border: 1px solid rgba(239, 68, 68, 0.3) !important;
        border-radius: 12px !important;
        box-shadow: 0 20px 60px rgba(0,0,0,0.5) !important;
      }
      .leaflet-popup-tip { background: #1a1a2e !important; }
      .leaflet-popup-close-button { color: #71717a !important; }
      .leaflet-popup-close-button:hover { color: #ef4444 !important; }
      .leaflet-control-zoom a {
        background: #1a1a2e !important;
        color: #e4e4e7 !important;
        border-color: #27272a !important;
      }
      .leaflet-control-zoom a:hover { background: #27272a !important; }
      .leaflet-control-attribution { display: none !important; }
    `;
    document.head.appendChild(style);

    const map = L.map(containerRef.current, {
      center: [20, 15],
      zoom: isMobile ? 2 : 3,
      minZoom: 2,
      maxZoom: 15,
      zoomControl: false,
      attributionControl: false,
      worldCopyJump: true,
    });

    // Zoom controls bottom-right (avoids header overlap on mobile)
    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Dark map tiles
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        maxZoom: 19,
        subdomains: "abcd",
      }
    ).addTo(map);

    mapRef.current = map;
    markersRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers when conflicts change
  useEffect(() => {
    if (!mapRef.current || !markersRef.current) return;

    markersRef.current.clearLayers();

    conflicts.forEach((conflict) => {
      // Skip conflicts with invalid coordinates
      if (conflict.lat == null || conflict.lng == null || isNaN(conflict.lat) || isNaN(conflict.lng)) return;

      const icon = createPulsingIcon(conflict.severity, isMobile ? 0.7 : 1);
      const config = SEVERITY_CONFIG[conflict.severity];

      const marker = L.marker([conflict.lat, conflict.lng], {
        icon,
        zIndexOffset: config.zIndex,
      });

      // Tooltip on hover
      marker.bindTooltip(
        `<div style="font-weight:600;font-size:13px;">${conflict.name}</div>
         <div style="font-size:11px;color:#a1a1aa;">${conflict.country}</div>
         <div style="font-size:10px;margin-top:4px;color:${config.color};text-transform:uppercase;letter-spacing:1px;">${conflict.severity} — ${conflict.type}</div>`,
        {
          className: "custom-tooltip",
          direction: "top",
          offset: [0, -config.pulseRadius],
          opacity: 0.95,
          interactive: false,
        }
      );

      // Click handler — close tooltip and open sidebar
      marker.on("click", () => {
        marker.closeTooltip();
        onMarkerClick(conflict);
        mapRef.current?.flyTo([conflict.lat, conflict.lng], isMobile ? 5 : 7, {
          duration: 1.2,
        });
      });

      markersRef.current!.addLayer(marker);
    });
  }, [conflicts, onMarkerClick, isMobile]);

  // Fly to selected conflict
  useEffect(() => {
    if (selectedConflict && mapRef.current) {
      mapRef.current.flyTo([selectedConflict.lat, selectedConflict.lng], isMobile ? 5 : 7, {
        duration: 1.2,
      });
    }
  }, [selectedConflict, isMobile]);

  return (
    <div
      ref={containerRef}
      className="flex-1 h-full"
      style={{ background: "#0a0a0f" }}
    />
  );
}
