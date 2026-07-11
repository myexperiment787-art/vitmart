import { NextRequest, NextResponse } from "next/server";
import { ensureSeedUsers, getUserFromRequest, listUsers, publicUser, setUserDisabled } from "@/src/lib/auth";
import type { UserRole } from "@/src/lib/auth";

const accountRoles: UserRole[] = ["customer", "delivery", "owner"];

export async function GET(req: NextRequest) {
  try {
    await ensureSeedUsers();
    const owner = await getUserFromRequest(req, "owner");
    if (!owner || owner.role !== "owner") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const users = await listUsers();
    const counts = accountRoles.reduce(
      (result, role) => ({
        ...result,
        [role]: users.filter((user) => user.role === role).length,
      }),
      {
        total: users.length,
        customer: 0,
        delivery: 0,
        owner: 0,
        disabledCustomers: users.filter((user) => user.role === "customer" && user.disabled_at).length,
      }
    );

    return NextResponse.json({
      success: true,
      owner: publicUser(owner),
      counts,
      accounts: users.map(publicUser),
    });
  } catch (error) {
    console.error("Owner accounts error:", error);
    return NextResponse.json({ success: false, error: "Failed to load accounts" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await ensureSeedUsers();
    const owner = await getUserFromRequest(req, "owner");
    if (!owner || owner.role !== "owner") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { accountId, disabled, reason } = await req.json();
    if (!accountId || typeof disabled !== "boolean") {
      return NextResponse.json({ success: false, error: "accountId and disabled are required" }, { status: 400 });
    }

    const users = await listUsers();
    const target = users.find((user) => user.id === String(accountId));
    if (!target) {
      return NextResponse.json({ success: false, error: "Account not found" }, { status: 404 });
    }

    if (target.role !== "customer") {
      return NextResponse.json({ success: false, error: "Only customer accounts can be disabled here" }, { status: 400 });
    }

    const updated = await setUserDisabled(String(accountId), disabled, typeof reason === "string" ? reason : null);
    if (!updated) {
      return NextResponse.json({ success: false, error: "Unable to update account" }, { status: 500 });
    }

    return NextResponse.json({ success: true, account: publicUser(updated) });
  } catch (error) {
    console.error("Owner account update error:", error);
    return NextResponse.json({ success: false, error: "Failed to update account" }, { status: 500 });
  }
}
