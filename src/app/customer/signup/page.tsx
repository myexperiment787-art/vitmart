"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "@/src/components/Navbar";

export default function CustomerSignupPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPath, setNextPath] = useState("/restaurants");
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNextPath(params.get("next") || "/restaurants");
  }, []);

  const onSignup = async () => {
    setError(null);
    if (!name.trim()) {
      setError("Enter your name");
      return;
    }
    if (phone.replace(/\D/g, "").length !== 10) {
      setError("Enter a valid 10-digit phone number");
      return;
    }
    if (password.trim().length < 4) {
      setError("Password must be at least 4 characters");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/customer/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, password }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Signup failed");
        return;
      }

      router.push(nextPath);
    } catch {
      setError("Unable to create account right now");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div style={{ minHeight: "calc(100vh - 90px)", display: "grid", placeItems: "center", background: "linear-gradient(135deg, #f0fdf4 0%, #ecfeff 100%)", padding: "24px" }}>
        <div style={{ width: "100%", maxWidth: "460px", background: "white", borderRadius: "18px", border: "1px solid #e2e8f0", boxShadow: "0 12px 30px rgba(2, 6, 23, 0.08)", padding: "24px" }}>
          <h1 style={{ margin: 0, fontSize: "30px", color: "#0f172a", fontWeight: 900 }}>Customer Sign Up</h1>
          <p style={{ marginTop: "8px", color: "#475569", fontSize: "14px" }}>Create account to place orders and track each delivery stage.</p>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            style={{ width: "100%", marginTop: "16px", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "12px", fontSize: "14px", boxSizing: "border-box" }}
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
            placeholder="Phone number"
            style={{ width: "100%", marginTop: "10px", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "12px", fontSize: "14px", boxSizing: "border-box" }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create password"
            style={{ width: "100%", marginTop: "10px", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "12px", fontSize: "14px", boxSizing: "border-box" }}
          />

          {error && <p style={{ color: "#dc2626", fontSize: "13px", marginTop: "10px" }}>{error}</p>}

          <button
            onClick={onSignup}
            disabled={loading}
            style={{ width: "100%", marginTop: "14px", border: "none", borderRadius: "12px", padding: "12px", fontWeight: 800, color: "white", background: "linear-gradient(135deg, #047857, #0ea5e9)", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Creating account..." : "Create account"}
          </button>

          <p style={{ marginTop: "12px", color: "#475569", fontSize: "13px" }}>
            Already have account? <Link href={`/customer/login?next=${encodeURIComponent(nextPath)}`} style={{ color: "#0e7490", fontWeight: 700 }}>Login here</Link>
          </p>
        </div>
      </div>
    </>
  );
}
