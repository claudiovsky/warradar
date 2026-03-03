"use client";

import { useEffect, useRef } from "react";

export default function AnimatedFavicon() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    canvasRef.current = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const startTime = Date.now();

    function draw() {
      if (!ctx) return;
      const elapsed = (Date.now() - startTime) / 1000;
      const t = (elapsed % 2) / 2; // 0-1 over 2 seconds

      ctx.clearRect(0, 0, 32, 32);

      // Pulse ring 1
      const r1 = 4 + t * 12;
      const a1 = Math.max(0, 0.6 * (1 - t));
      ctx.beginPath();
      ctx.arc(16, 16, r1, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(239, 68, 68, ${a1})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Pulse ring 2 (delayed)
      const t2 = ((elapsed + 0.6) % 2) / 2;
      const r2 = 4 + t2 * 10;
      const a2 = Math.max(0, 0.4 * (1 - t2));
      ctx.beginPath();
      ctx.arc(16, 16, r2, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(239, 68, 68, ${a2})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Core dot
      const glow = 0.85 + 0.15 * Math.sin(elapsed * Math.PI);
      ctx.globalAlpha = glow;

      // Outer red
      ctx.beginPath();
      ctx.arc(16, 16, 7, 0, Math.PI * 2);
      ctx.fillStyle = "#ef4444";
      ctx.fill();

      // Mid ring
      ctx.beginPath();
      ctx.arc(16, 16, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(252, 165, 165, 0.4)";
      ctx.fill();

      // Center white
      ctx.beginPath();
      ctx.arc(16, 16, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.fill();

      ctx.globalAlpha = 1;

      // Update favicon
      const url = canvas.toDataURL("image/png");
      let link = document.querySelector<HTMLLinkElement>('link[rel="icon"][type="image/png"][data-animated]');
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        link.type = "image/png";
        link.setAttribute("data-animated", "true");
        document.head.appendChild(link);
      }
      link.href = url;

      // ~15fps is enough for a favicon
      animId = window.setTimeout(() => {
        frameRef.current = requestAnimationFrame(draw);
      }, 66);
    }

    frameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frameRef.current);
      clearTimeout(animId);
    };
  }, []);

  return null;
}
