/**
 * Auth API Route
 * Handles admin authentication with multiple actions
 *
 * POST /api/auth
 * Actions:
 *   - { action: "check" } - Check if admin account exists
 *   - { action: "setup", password, confirmPassword } - Create admin account
 *   - { action: "login", password } - Login with password
 *   - { action: "changePassword", currentPassword, newPassword } - Change password
 */

import { NextRequest, NextResponse } from "next/server";
import {
    adminExists,
    createAdmin,
    verifyAdminPassword,
    changeAdminPassword,
    setAdminCookie,
    verifyAdminCookie,
    getSessionInfo,
} from "@/lib/auth";
import { validateCsrf } from "@/lib/csrf";

// middleware.ts handles rate limiting for this route.

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action } = body;

        // Check if admin account exists (read-only, skip CSRF)
        if (action === "check") {
            const exists = await adminExists();
            const isLoggedIn = await verifyAdminCookie();
            const sessionInfo = isLoggedIn ? await getSessionInfo() : null;

            return NextResponse.json({
                success: true,
                exists,
                isLoggedIn,
                sessionInfo,
            });
        }

        // Validate CSRF for all mutating actions
        const csrf = validateCsrf(request);
        if (!csrf.valid) {
            return NextResponse.json(
                { success: false, error: csrf.error },
                { status: 403 }
            );
        }

        // Setup new admin account
        if (action === "setup") {
            const { password, confirmPassword } = body;

            // Validate
            if (!password || password.length < 8) {
                return NextResponse.json(
                    { success: false, error: "Password must be at least 8 characters" },
                    { status: 400 }
                );
            }

            if (password !== confirmPassword) {
                return NextResponse.json(
                    { success: false, error: "Passwords do not match" },
                    { status: 400 }
                );
            }

            const exists = await adminExists();
            if (exists) {
                return NextResponse.json(
                    { success: false, error: "Admin account already exists" },
                    { status: 400 }
                );
            }

            await createAdmin(password);
            await setAdminCookie();

            return NextResponse.json({
                success: true,
                message: "Admin account created successfully",
            });
        }

        // Login with password
        if (action === "login") {
            const { password } = body;

            if (!password) {
                return NextResponse.json(
                    { success: false, error: "Password required" },
                    { status: 400 }
                );
            }

            const exists = await adminExists();
            if (!exists) {
                return NextResponse.json(
                    { success: false, error: "No admin account exists", needsSetup: true },
                    { status: 400 }
                );
            }

            const isValid = await verifyAdminPassword(password);
            if (!isValid) {
                return NextResponse.json(
                    { success: false, error: "Invalid password" },
                    { status: 401 }
                );
            }

            await setAdminCookie();

            return NextResponse.json({
                success: true,
                message: "Authentication successful",
            });
        }

        // Change password
        if (action === "changePassword") {
            const isLoggedIn = await verifyAdminCookie();
            if (!isLoggedIn) {
                return NextResponse.json(
                    { success: false, error: "Not authenticated" },
                    { status: 401 }
                );
            }

            const { currentPassword, newPassword } = body;

            if (!currentPassword || !newPassword) {
                return NextResponse.json(
                    { success: false, error: "Both passwords required" },
                    { status: 400 }
                );
            }

            if (newPassword.length < 8) {
                return NextResponse.json(
                    { success: false, error: "New password must be at least 8 characters" },
                    { status: 400 }
                );
            }

            const changed = await changeAdminPassword(currentPassword, newPassword);
            if (!changed) {
                return NextResponse.json(
                    { success: false, error: "Current password is incorrect" },
                    { status: 401 }
                );
            }

            return NextResponse.json({
                success: true,
                message: "Password changed successfully",
            });
        }

        // Legacy support: Check if username matches secret (for terminal trigger)
        const { username, password } = body;
        const adminSecret = process.env.ADMIN_SECRET;

        if (username && !password) {
            // Check if this is the secret command trigger
            if (adminSecret && username === adminSecret) {
                const exists = await adminExists();
                const isLoggedIn = await verifyAdminCookie();
                const sessionInfo = isLoggedIn ? await getSessionInfo() : null;

                return NextResponse.json({
                    success: true,
                    isSecret: true,
                    needsSetup: !exists,
                    isLoggedIn,
                    sessionInfo,
                });
            }
            return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
        }

        return NextResponse.json(
            { success: false, error: "Invalid action" },
            { status: 400 }
        );
    } catch (error) {
        console.error("Auth error:", error);
        return NextResponse.json(
            { success: false, error: "Server error" },
            { status: 500 }
        );
    }
}
