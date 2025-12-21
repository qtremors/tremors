/**
 * API Route: /api/newspaper/active
 * Set which edition is active for a given day (admin only)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * POST: Set an edition as active (deactivates others for same day)
 * Body: { editionId: string }
 */
export async function POST(request: Request) {
    try {
        // Check for admin cookie
        const authCookie = request.headers.get("cookie")?.includes("admin_session");
        if (!authCookie) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { editionId } = await request.json();
        if (!editionId) {
            return NextResponse.json({ error: "editionId required" }, { status: 400 });
        }

        // Get the edition to find its date
        const edition = await prisma.newspaperEdition.findUnique({
            where: { id: editionId },
        });

        if (!edition) {
            return NextResponse.json({ error: "Edition not found" }, { status: 404 });
        }

        // Get start and end of that day
        const dayStart = new Date(edition.date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(edition.date);
        dayEnd.setHours(23, 59, 59, 999);

        // Deactivate all editions for that day
        await prisma.newspaperEdition.updateMany({
            where: {
                date: { gte: dayStart, lte: dayEnd },
            },
            data: { isActive: false },
        });

        // Activate the selected one
        const updated = await prisma.newspaperEdition.update({
            where: { id: editionId },
            data: { isActive: true },
        });

        return NextResponse.json({
            success: true,
            edition: {
                ...updated,
                bodyContent: JSON.parse(updated.bodyContent),
            },
        });
    } catch (error) {
        console.error("Failed to set active edition:", error);
        return NextResponse.json(
            { error: "Failed to set active edition" },
            { status: 500 }
        );
    }
}
