"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "@/src/components/Navbar";

export default function ForgotPasswordPage() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [tokenValue, setTokenValue] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const nextPath = "/customer/login";

  const onSubmit = async () => {
    setError(null);
    setMessage(null);
    try {
      setLoading(true);
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, role: "customer" }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Unable to create reset link");
        return;
      }
      setMessage(`Reset link created: ${data.resetUrl}`);
      setTokenValue(String(data.token || ""));
    } catch {
      setError("Unable to create reset link right now");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div style={{ minHeight: "calc(100vh - 90px)", display: "grid", placeItems: "center", background: "linear-gradient(135deg, #f8fafc 0%, #f0fdf4 100%)", padding: "24px" }}>
        <div style={{ width: "100%", maxWidth: "460px", background: "white", borderRadius: "18px", border: "1px solid #e2e8f0", boxShadow: "0 12px 30px rgba(2, 6, 23, 0.08)", padding: "24px" }}>
          <h1 style={{ margin: 0, fontSize: "30px", color: "#0f172a", fontWeight: 900 }}>Forgot Password</h1>
          <p style={{ marginTop: "8px", color: "#475569", fontSize: "14px" }}>Create a reset link for your customer account.</p>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))} placeholder="Phone number" style={{ width: "100%", marginTop: "16px", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "12px", fontSize: "14px", boxSizing: "border-box" }} />
          {error && <p style={{ color: "#dc2626", fontSize: "13px", marginTop: "10px" }}>{error}</p>}
          {message && (
            <p style={{ color: "#166534", fontSize: "13px", marginTop: "10px", wordBreak: "break-word" }}>
              {message} {tokenValue && <Link href={`/auth/change-password?token=${encodeURIComponent(tokenValue)}`} style={{ color: "#0e7490", fontWeight: 700 }}>Open reset page</Link>}
            </p>
          )}
          <button onClick={onSubmit} disabled={loading} style={{ width: "100%", marginTop: "14px", border: "none", borderRadius: "12px", padding: "12px", fontWeight: 800, color: "white", background: "linear-gradient(135deg, #047857, #0ea5e9)", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}> {loading ? "Creating reset link..." : "Create reset link"} </button>
          <p style={{ marginTop: "12px", color: "#475569", fontSize: "13px" }}>
            Back to login: <Link href={nextPath} style={{ color: "#0e7490", fontWeight: 700 }}>go back</Link>
          </p>
        </div>
      </div>
    </>
  );
}
