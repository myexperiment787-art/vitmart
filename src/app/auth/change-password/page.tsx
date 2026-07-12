"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "@/src/components/Navbar";

export default function ChangePasswordPage() {
  const [token, setToken] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token") || "");
  }, []);

  const onSubmit = async () => {
    setError(null);
    setMessage(null);
    try {
      setLoading(true);
      const endpoint = token ? "/api/auth/reset-password" : "/api/auth/change-password";
      const payload = token ? { token, newPassword } : { currentPassword, newPassword };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Unable to update password");
        return;
      }
      setMessage("Password updated successfully");
    } catch {
      setError("Unable to update password right now");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div style={{ minHeight: "calc(100vh - 90px)", display: "grid", placeItems: "center", background: "linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)", padding: "24px" }}>
        <div style={{ width: "100%", maxWidth: "460px", background: "white", borderRadius: "18px", border: "1px solid #e2e8f0", boxShadow: "0 12px 30px rgba(2, 6, 23, 0.08)", padding: "24px" }}>
          <h1 style={{ margin: 0, fontSize: "30px", color: "#0f172a", fontWeight: 900 }}>{token ? "Reset Password" : "Change Password"}</h1>
          <p style={{ marginTop: "8px", color: "#475569", fontSize: "14px" }}>Update your customer password.</p>
          {!token ? <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current password" style={{ width: "100%", marginTop: "16px", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "12px", fontSize: "14px", boxSizing: "border-box" }} /> : null}
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" style={{ width: "100%", marginTop: "10px", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "12px", fontSize: "14px", boxSizing: "border-box" }} />
          {error && <p style={{ color: "#dc2626", fontSize: "13px", marginTop: "10px" }}>{error}</p>}
          {message && <p style={{ color: "#166534", fontSize: "13px", marginTop: "10px" }}>{message}</p>}
          <button onClick={onSubmit} disabled={loading} style={{ width: "100%", marginTop: "14px", border: "none", borderRadius: "12px", padding: "12px", fontWeight: 800, color: "white", background: "linear-gradient(135deg, #2563eb, #0ea5e9)", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}> {loading ? "Saving..." : "Save password"} </button>
          <p style={{ marginTop: "12px", color: "#475569", fontSize: "13px" }}>
            Back to login: <Link href={`/customer/login`} style={{ color: "#0e7490", fontWeight: 700 }}>open login</Link>
          </p>
        </div>
      </div>
    </>
  );
}
