import { NextRequest, NextResponse } from "next/server";
import { clearAdminCookie, verifyAdminCookie } from "@/lib/auth";
import { validateCsrf } from "@/lib/csrf";

/**
 * Logout API Route
 * Clears admin session cookie
 * 
 * POST /api/auth/logout
 * Returns: { success: boolean }
 */

export async function POST(request: NextRequest) {
    // Validate CSRF
    const csrf = validateCsrf(request);
    if (!csrf.valid) {
        return NextResponse.json(
            { success: false, error: csrf.error },
            { status: 403 }
        );
    }

    // Verify the user is actually authenticated before clearing
    const isAdmin = await verifyAdminCookie();
    if (!isAdmin) {
        return NextResponse.json(
            { success: false, error: "Not authenticated" },
            { status: 401 }
        );
    }

    try {
        await clearAdminCookie();
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json(
            { success: false, error: "Failed to logout" },
            { status: 500 }
        );
    }
}
