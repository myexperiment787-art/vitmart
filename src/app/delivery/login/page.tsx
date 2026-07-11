"use client";

import { useEffect, useState } from "react";
import Navbar from "@/src/components/Navbar";

export default function DeliveryLoginPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [nextPath, setNextPath] = useState("/delivery/orders");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNextPath(params.get("next") || "/delivery/orders");
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
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password, role: "delivery" }),
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
      <div style={{ minHeight: "calc(100vh - 90px)", display: "grid", placeItems: "center", background: "linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)", padding: "24px" }}>
        <div style={{ width: "100%", maxWidth: "460px", background: "white", borderRadius: "18px", border: "1px solid #dbe4f0", boxShadow: "0 14px 34px rgba(15, 23, 42, 0.08)", padding: "24px" }}>
          <h1 style={{ margin: 0, fontSize: "30px", color: "#0f172a", fontWeight: 900 }}>Delivery Login</h1>
          <p style={{ marginTop: "8px", color: "#475569", fontSize: "14px", lineHeight: 1.6 }}>
            Login to see assigned deliveries, pickup queue, completed orders, and your earnings.
          </p>

          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
            placeholder="Delivery phone number"
            style={{ width: "100%", marginTop: "16px", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "12px", fontSize: "14px", boxSizing: "border-box" }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            style={{ width: "100%", marginTop: "10px", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "12px", fontSize: "14px", boxSizing: "border-box" }}
          />

          {error ? <p style={{ color: "#dc2626", fontSize: "13px", marginTop: "10px", fontWeight: 700 }}>{error}</p> : null}

          <button
            onClick={onLogin}
            disabled={loading}
            style={{ width: "100%", marginTop: "14px", border: "none", borderRadius: "12px", padding: "12px", fontWeight: 900, color: "white", background: "linear-gradient(135deg, #2563eb, #0ea5e9)", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Logging in..." : "Login as Delivery Boy"}
          </button>

          <p style={{ margin: "12px 0 0", color: "#64748b", fontSize: "12px", lineHeight: 1.5 }}>
            Delivery accounts are created by the admin using environment variables.
          </p>
        </div>
      </div>
    </>
  );
}
