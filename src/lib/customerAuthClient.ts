export type CurrentUser = {
  id: string;
  name: string;
  phone: string;
  role: string;
  created_at: string | number;
};

export type SessionResponse = {
  success: boolean;
  user?: CurrentUser;
  customer?: CurrentUser;
  error?: string;
};

export async function getCustomerSession() {
  try {
    const res = await fetch("/api/customer/me", {
      cache: "no-store",
      credentials: "include",
    });
    // some environments may return an empty body or non-JSON on error — handle safely
    const text = await res.text();
    if (!text) return null;
    try {
      const data = JSON.parse(text) as SessionResponse;
      return data.success ? data.user || data.customer || null : null;
    } catch (e) {
      return null;
    }
  } catch (e) {
    return null;
  }
}

export async function getSession() {
  return getCustomerSession();
}

export async function logout() {
  await fetch("/api/auth/logout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ role: "customer" }),
  });
}
