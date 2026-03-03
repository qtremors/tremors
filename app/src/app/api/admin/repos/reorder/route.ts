/**
 * Admin API: Batch Reorder Repos
 * POST - Update multiple repo orders in a single transaction
 * Protected: Requires valid admin session cookie + CSRF validation
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdminCookie } from "@/lib/auth";
import { validateCsrf } from "@/lib/csrf";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
    // Validate CSRF
    const csrf = validateCsrf(request);
    if (!csrf.valid) {
        return NextResponse.json(
            { success: false, error: csrf.error },
            { status: 403 }
        );
    }

    // Verify admin session
    const isAdmin = await verifyAdminCookie();
    if (!isAdmin) {
        return NextResponse.json(
            { success: false, error: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
        const body = await request.json();
        const { orders } = body; // Array of { id: number, order: number }

        if (!Array.isArray(orders)) {
            return NextResponse.json(
                { success: false, error: "Orders array required" },
                { status: 400 }
            );
        }

        // Validate each item has numeric id and order
        const isValid = orders.every(
            (item: unknown) =>
                typeof item === "object" && item !== null &&
                typeof (item as Record<string, unknown>).id === "number" &&
                typeof (item as Record<string, unknown>).order === "number"
        );
        if (!isValid) {
            return NextResponse.json(
                { success: false, error: "Each item must have numeric id and order" },
                { status: 400 }
            );
        }

        // Use transaction to update all orders
        await prisma.$transaction(
            orders.map((item) =>
                prisma.repo.update({
                    where: { id: item.id },
                    data: { order: item.order },
                })
            )
        );

        revalidatePath("/");

        return NextResponse.json({
            success: true,
            message: `Updated ${orders.length} repo orders`,
        });
    } catch (error) {
        console.error("Batch reorder error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to update repo orders" },
            { status: 500 }
        );
    }
}
