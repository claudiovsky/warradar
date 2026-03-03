"use client";

import { useState } from "react";

interface CollaborateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CollaborateModal({ isOpen, onClose }: CollaborateModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [why, setWhy] = useState("");
  const [how, setHow] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setResult(null);

    try {
      const res = await fetch("/api/collaborate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), why: why.trim(), how: how.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult({ ok: true, message: "Message sent successfully! We'll get back to you soon." });
        setName("");
        setEmail("");
        setWhy("");
        setHow("");
      } else {
        setResult({ ok: false, message: data.error || "Something went wrong." });
      }
    } catch {
      setResult({ ok: false, message: "Network error. Please try again." });
    } finally {
      setSending(false);
    }
  }

  function handleClose() {
    if (!sending) {
      setResult(null);
      onClose();
    }
  }

  if (!isOpen) return null;

  const inputClass =
    "w-full bg-zinc-900/80 border border-zinc-700/50 rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none transition-colors focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 placeholder:text-zinc-600";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[2001] flex items-center justify-center p-4">
        <div
          className="w-full max-w-lg bg-[#0f0f1a] border border-zinc-800/50 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden animate-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 sm:px-6 pt-5 sm:pt-6 pb-0">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <span className="text-red-500">🤝</span>
                Collaborate with Us
              </h2>
              <p className="text-zinc-500 text-xs sm:text-sm mt-1">
                Join the WAR-RADAR project and make an impact
              </p>
            </div>
            <button
              onClick={handleClose}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-700/50 active:bg-zinc-600/50 transition-all flex-shrink-0"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-5 sm:px-6 py-5 sm:py-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-400 text-xs uppercase tracking-wider mb-1.5 font-medium">
                  Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={100}
                  placeholder="Your name"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-zinc-400 text-xs uppercase tracking-wider mb-1.5 font-medium">
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  maxLength={200}
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 text-xs uppercase tracking-wider mb-1.5 font-medium">
                Why do you want to collaborate? *
              </label>
              <textarea
                value={why}
                onChange={(e) => setWhy(e.target.value)}
                required
                maxLength={2000}
                rows={3}
                placeholder="Tell us your motivation and what drives you to contribute to this project..."
                className={`${inputClass} resize-none`}
              />
            </div>

            <div>
              <label className="block text-zinc-400 text-xs uppercase tracking-wider mb-1.5 font-medium">
                How can you contribute? *
              </label>
              <textarea
                value={how}
                onChange={(e) => setHow(e.target.value)}
                required
                maxLength={2000}
                rows={3}
                placeholder="Describe your skills, expertise, or how you'd like to help (e.g., development, research, journalism, design...)"
                className={`${inputClass} resize-none`}
              />
            </div>

            {/* Result message */}
            {result && (
              <div
                className={`px-4 py-3 rounded-xl text-sm ${
                  result.ok
                    ? "bg-green-500/10 border border-green-500/30 text-green-400"
                    : "bg-red-500/10 border border-red-500/30 text-red-400"
                }`}
              >
                {result.message}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={sending}
              className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:bg-red-900 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 text-sm"
            >
              {sending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 rounded-full animate-spin border-t-white" />
                  Sending...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  Send Collaboration Request
                </>
              )}
            </button>

            <p className="text-zinc-600 text-[10px] text-center">
              Your message will be reviewed by the WAR-RADAR team
            </p>
          </form>
        </div>
      </div>
    </>
  );
}
