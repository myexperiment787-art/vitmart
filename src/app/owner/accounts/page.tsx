"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "@/src/components/Navbar";

type Account = {
  id: string;
  name: string;
  phone: string;
  role: "customer" | "owner" | "delivery";
  created_at: string | number;
  disabled_at?: string | number | null;
  disabled_reason?: string | null;
};

type AccountCounts = {
  total: number;
  customer: number;
  delivery: number;
  owner: number;
  disabledCustomers?: number;
};

export default function OwnerAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [counts, setCounts] = useState<AccountCounts>({ total: 0, customer: 0, delivery: 0, owner: 0 });
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [updatingAccountId, setUpdatingAccountId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const loadAccounts = async () => {
    setError(null);
    try {
      setLoading(true);
      const res = await fetch("/api/owner/accounts", {
        cache: "no-store",
        credentials: "include",
      });

      if (res.status === 401) {
        setIsAuthorized(false);
        setAccounts([]);
        return;
      }

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Unable to load accounts");

      setIsAuthorized(true);
      setCounts(data.counts || { total: 0, customer: 0, delivery: 0, owner: 0 });
      setAccounts(Array.isArray(data.accounts) ? data.accounts : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAccounts();
  }, []);

  const onOwnerLogin = async () => {
    setError(null);
    if (phone.replace(/\D/g, "").length !== 10) {
      setError("Enter a valid 10-digit owner phone number");
      return;
    }
    if (!password.trim()) {
      setError("Enter owner password");
      return;
    }

    try {
      setLoginLoading(true);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone, password, role: "owner" }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Owner login failed");
        return;
      }
      await loadAccounts();
    } catch {
      setError("Unable to login right now");
    } finally {
      setLoginLoading(false);
    }
  };

  const groupedAccounts = useMemo(() => {
    return accounts.reduce<Record<string, Account[]>>((result, account) => {
      const role = account.role;
      result[role] = [...(result[role] || []), account];
      return result;
    }, {});
  }, [accounts]);

  const updateCustomerStatus = async (account: Account, disabled: boolean) => {
    const action = disabled ? "disable" : "enable";
    if (disabled && !window.confirm(`Disable ${account.name}'s customer account? This phone number will not be able to login or sign up again.`)) {
      return;
    }

    setError(null);
    try {
      setUpdatingAccountId(account.id);
      const res = await fetch("/api/owner/accounts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          accountId: account.id,
          disabled,
          reason: disabled ? "Disabled by owner" : null,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || `Unable to ${action} account`);
      await loadAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Unable to ${action} account`);
    } finally {
      setUpdatingAccountId(null);
    }
  };

  const statCards = [
    { label: "Total accounts", value: counts.total, color: "#0f172a" },
    { label: "Customers", value: counts.customer, color: "#0f766e" },
    { label: "Disabled customers", value: counts.disabledCustomers || 0, color: "#dc2626" },
    { label: "Delivery boys", value: counts.delivery, color: "#2563eb" },
    { label: "Owners", value: counts.owner, color: "#7c3aed" },
  ];

  return (
    <>
      <Navbar />
      <main style={{ minHeight: "calc(100vh - 90px)", background: "#f8fafc", padding: "28px 18px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            <div>
              <h1 style={{ margin: 0, color: "#0f172a", fontSize: 32, fontWeight: 900 }}>Account Dashboard</h1>
              <p style={{ margin: "6px 0 0", color: "#475569", fontSize: 14 }}>View how many customer, owner, and delivery accounts are created.</p>
            </div>
            {isAuthorized ? (
              <button onClick={loadAccounts} style={{ border: "1px solid #cbd5e1", background: "white", color: "#0f172a", borderRadius: 10, padding: "10px 14px", fontWeight: 800, cursor: "pointer" }}>
                Refresh
              </button>
            ) : null}
          </div>

          {loading ? (
            <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24, color: "#64748b", fontWeight: 700 }}>Loading accounts...</div>
          ) : !isAuthorized ? (
            <section style={{ maxWidth: 460, background: "white", border: "1px solid #dbe4f0", borderRadius: 14, padding: 22, boxShadow: "0 12px 28px rgba(15,23,42,0.08)" }}>
              <h2 style={{ margin: 0, color: "#0f172a", fontSize: 24, fontWeight: 900 }}>Owner Login</h2>
              <p style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>Only an owner can view account counts.</p>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
                placeholder="Owner phone number"
                style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: 10, padding: 12, fontSize: 14, boxSizing: "border-box", marginTop: 10 }}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Owner password"
                style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: 10, padding: 12, fontSize: 14, boxSizing: "border-box", marginTop: 10 }}
              />
              {error ? <p style={{ color: "#dc2626", fontWeight: 700, fontSize: 13 }}>{error}</p> : null}
              <button
                onClick={onOwnerLogin}
                disabled={loginLoading}
                style={{ width: "100%", marginTop: 14, border: "none", borderRadius: 12, padding: 12, color: "white", fontWeight: 900, cursor: loginLoading ? "not-allowed" : "pointer", opacity: loginLoading ? 0.7 : 1, background: "linear-gradient(135deg, #0f766e, #2563eb)" }}
              >
                {loginLoading ? "Logging in..." : "Login and view accounts"}
              </button>
            </section>
          ) : (
            <>
              {error ? <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: 10, padding: 12, marginBottom: 16, fontWeight: 700 }}>{error}</div> : null}

              <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 18 }}>
                {statCards.map((stat) => (
                  <div key={stat.label} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
                    <div style={{ color: "#64748b", fontSize: 13, fontWeight: 800 }}>{stat.label}</div>
                    <div style={{ color: stat.color, fontSize: 32, fontWeight: 900, marginTop: 6 }}>{stat.value}</div>
                  </div>
                ))}
              </section>

              <section style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0", fontWeight: 900, color: "#0f172a" }}>All accounts</div>
                {accounts.length === 0 ? (
                  <div style={{ padding: 18, color: "#64748b", fontWeight: 700 }}>No accounts found.</div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                      <thead>
                        <tr style={{ background: "#f8fafc", color: "#475569", textAlign: "left" }}>
                          <th style={{ padding: 12 }}>Name</th>
                          <th style={{ padding: 12 }}>Phone</th>
                          <th style={{ padding: 12 }}>Role</th>
                          <th style={{ padding: 12 }}>Status</th>
                          <th style={{ padding: 12 }}>Created</th>
                          <th style={{ padding: 12 }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {accounts.map((account) => (
                          <tr key={account.id} style={{ borderTop: "1px solid #eef2f7" }}>
                            <td style={{ padding: 12, fontWeight: 800, color: "#0f172a" }}>{account.name}</td>
                            <td style={{ padding: 12, color: "#334155" }}>{account.phone}</td>
                            <td style={{ padding: 12, textTransform: "capitalize", color: "#334155" }}>{account.role === "delivery" ? "delivery boy" : account.role}</td>
                            <td style={{ padding: 12 }}>
                              {account.disabled_at ? (
                                <span style={{ display: "inline-block", background: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca", borderRadius: 999, padding: "4px 9px", fontSize: 12, fontWeight: 900 }}>
                                  Disabled
                                </span>
                              ) : (
                                <span style={{ display: "inline-block", background: "#ecfdf5", color: "#166534", border: "1px solid #bbf7d0", borderRadius: 999, padding: "4px 9px", fontSize: 12, fontWeight: 900 }}>
                                  Active
                                </span>
                              )}
                            </td>
                            <td style={{ padding: 12, color: "#64748b" }}>{new Date(Number(account.created_at)).toLocaleString()}</td>
                            <td style={{ padding: 12 }}>
                              {account.role === "customer" ? (
                                <button
                                  onClick={() => updateCustomerStatus(account, !account.disabled_at)}
                                  disabled={updatingAccountId === account.id}
                                  style={{ border: "none", borderRadius: 9, padding: "8px 10px", color: "white", fontWeight: 900, cursor: updatingAccountId === account.id ? "not-allowed" : "pointer", opacity: updatingAccountId === account.id ? 0.7 : 1, background: account.disabled_at ? "#16a34a" : "#dc2626" }}
                                >
                                  {updatingAccountId === account.id ? "Saving..." : account.disabled_at ? "Enable" : "Disable"}
                                </button>
                              ) : (
                                <span style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700 }}>Owner only</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, marginTop: 18 }}>
                {Object.entries(groupedAccounts).map(([role, list]) => (
                  <div key={role} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: 14 }}>
                    <div style={{ fontWeight: 900, color: "#0f172a", textTransform: "capitalize" }}>{role === "delivery" ? "Delivery boys" : role}</div>
                    <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
                      {list.map((account) => (
                        <div key={account.id} style={{ color: "#475569", fontSize: 13 }}>
                          {account.name} - {account.phone}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            </>
          )}
        </div>
      </main>
    </>
  );
}
