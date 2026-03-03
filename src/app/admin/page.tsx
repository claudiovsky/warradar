"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(24,24,27,0.8)",
  border: "1px solid rgba(63,63,70,0.5)",
  borderRadius: 12,
  padding: "14px 18px",
  fontSize: 14,
  color: "#e4e4e7",
  outline: "none",
  transition: "border-color 0.2s",
};

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/admin/dashboard");
    } catch (err) {
      setError("Invalid credentials. Access denied.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0f",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        overflow: "auto",
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 60,
              height: 60,
              background: "#dc2626",
              borderRadius: 16,
              boxShadow: "0 8px 30px rgba(220,38,38,0.25)",
              marginBottom: 16,
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "0.08em",
              marginBottom: 4,
            }}
          >
            WAR-<span style={{ color: "#ef4444" }}>RADAR</span>
          </h1>
          <p style={{ color: "#71717a", fontSize: 14 }}>Admin Panel</p>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleLogin}
          style={{
            background: "#0f0f1a",
            border: "1px solid rgba(39,39,42,0.5)",
            borderRadius: 20,
            padding: "36px 32px 28px",
          }}
        >
          {/* Email Field */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                color: "#a1a1aa",
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 8,
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
              placeholder="admin@example.com"
              required
              autoComplete="email"
              style={{
                ...inputStyle,
                borderColor:
                  focusedField === "email"
                    ? "rgba(239,68,68,0.5)"
                    : "rgba(63,63,70,0.5)",
              }}
            />
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: "block",
                color: "#a1a1aa",
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 8,
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
              placeholder="••••••••••"
              required
              autoComplete="current-password"
              style={{
                ...inputStyle,
                borderColor:
                  focusedField === "password"
                    ? "rgba(239,68,68,0.5)"
                    : "rgba(63,63,70,0.5)",
              }}
            />
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: 12,
                padding: "12px 16px",
                color: "#f87171",
                fontSize: 13,
                marginBottom: 20,
              }}
            >
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              background: loading ? "#7f1d1d" : "#dc2626",
              color: "#fff",
              fontWeight: 600,
              fontSize: 15,
              padding: "14px 0",
              borderRadius: 12,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.2s",
              boxShadow: "0 4px 20px rgba(220,38,38,0.25)",
            }}
            onMouseEnter={(e) => {
              if (!loading)
                (e.target as HTMLButtonElement).style.background = "#b91c1c";
            }}
            onMouseLeave={(e) => {
              if (!loading)
                (e.target as HTMLButtonElement).style.background = "#dc2626";
            }}
          >
            {loading ? (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ animation: "spin 1s linear infinite" }}
                >
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </svg>
                Authenticating...
              </span>
            ) : (
              "Sign In"
            )}
          </button>

          <p
            style={{
              color: "#52525b",
              fontSize: 11,
              textAlign: "center",
              marginTop: 16,
            }}
          >
            Restricted access — authorized personnel only
          </p>
        </form>

        {/* Back link */}
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Link
            href="/"
            style={{
              color: "#52525b",
              fontSize: 13,
              textDecoration: "none",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = "#a1a1aa";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = "#52525b";
            }}
          >
            ← Back to Map
          </Link>
        </div>
      </div>
    </div>
  );
}
