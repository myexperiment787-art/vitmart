"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "@/src/components/Navbar";

export default function CustomerLoginPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPath, setNextPath] = useState("/restaurants");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNextPath(params.get("next") || "/restaurants");
  }, []);

  const onLogin = async () => {
    setError(null);
    if (phone.replace(/\D/g, "").length !== 10) {
      setError("Enter a valid 10-digit phone number");
      return;
    }
    if (!password.trim()) {
      setError("Enter your password");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/customer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Login failed");
        return;
      }

      window.location.href = nextPath;
    } catch {
      setError("Unable to login right now");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div style={{ minHeight: "calc(100vh - 90px)", display: "grid", placeItems: "center", background: "linear-gradient(135deg, #f8fafc 0%, #ecfeff 100%)", padding: "24px" }}>
        <div style={{ width: "100%", maxWidth: "460px", background: "white", borderRadius: "18px", border: "1px solid #e2e8f0", boxShadow: "0 12px 30px rgba(2, 6, 23, 0.08)", padding: "24px" }}>
          <h1 style={{ margin: 0, fontSize: "30px", color: "#0f172a", fontWeight: 900 }}>Customer Login</h1>
          <p style={{ marginTop: "8px", color: "#475569", fontSize: "14px" }}>Login to place order and track status: accepted, picked up, delivered.</p>

          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
            placeholder="Phone number"
            style={{ width: "100%", marginTop: "16px", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "12px", fontSize: "14px", boxSizing: "border-box" }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            style={{ width: "100%", marginTop: "10px", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "12px", fontSize: "14px", boxSizing: "border-box" }}
          />

          {error && <p style={{ color: "#dc2626", fontSize: "13px", marginTop: "10px" }}>{error}</p>}

          <button
            onClick={onLogin}
            disabled={loading}
            style={{ width: "100%", marginTop: "14px", border: "none", borderRadius: "12px", padding: "12px", fontWeight: 800, color: "white", background: "linear-gradient(135deg, #0f766e, #0891b2)", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <p style={{ marginTop: "12px", color: "#475569", fontSize: "13px" }}>
            New customer? <Link href={`/customer/signup?next=${encodeURIComponent(nextPath)}`} style={{ color: "#0e7490", fontWeight: 700 }}>Create account</Link>
          </p>
          <p style={{ marginTop: "6px", color: "#475569", fontSize: "13px" }}>
            Forgot password? <Link href={`/auth/forgot-password?role=customer&next=${encodeURIComponent(nextPath)}`} style={{ color: "#0e7490", fontWeight: 700 }}>Reset here</Link>
          </p>
        </div>
      </div>
    </>
  );
}
