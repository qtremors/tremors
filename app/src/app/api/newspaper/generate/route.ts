/**
 * API Route: /api/newspaper/generate
 * Generates hilarious daily newspaper content using Gemini AI
 * Falls back to stored content if API unavailable
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PERSONAL, SKILLS } from "@/config/site";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const MODEL = "gemini-flash-lite-latest"; // Latest flash lite model

// Fallback content when AI is unavailable
const FALLBACK_CONTENT = {
    headline: `${PERSONAL.name.split(" ")[0].toUpperCase()} CONTINUES REIGN OF TERROR ACROSS GITHUB`,
    subheadline: "Repositories tremble as commits pile up at alarming rate",
    bodyContent: JSON.stringify([
        `In what industry analysts are calling "absolutely expected behavior," local developer ${PERSONAL.name} has once again demonstrated an unwavering commitment to pushing code at hours that medical professionals describe as "concerning."`,
        `Sources close to the keyboard report that the developer has mastered technologies including ${SKILLS[0]?.skills.slice(0, 3).join(", ") || "various programming languages"}, leaving competitors to wonder: "Do they ever sleep?"`,
        `When reached for comment, ${PERSONAL.name.split(" ")[0]} simply muttered something about "one more commit" before returning to what witnesses describe as "an unhealthy number of browser tabs."`
    ]),
    pullQuote: `"I'll refactor it tomorrow." — ${PERSONAL.name.split(" ")[0]}, reportedly every single day`,
};

interface GeminiResponse {
    candidates?: Array<{
        content: {
            parts: Array<{ text: string }>;
        };
    }>;
}

/**
 * Build context for Gemini about the developer
 */
async function buildContext() {
    const repos = await prisma.repo.findMany({
        where: { hidden: false },
        orderBy: { pushedAt: "desc" },
        take: 10,
    });

    const commits = await prisma.commit.findMany({
        orderBy: { date: "desc" },
        take: 10,
    });

    const repoNames = repos.map(r => r.name).join(", ");
    const recentActivity = commits.map((c: { repoName: string; message: string }) => `${c.repoName}: ${c.message}`).join("\n");
    const skills = SKILLS.map(s => `${s.id}: ${s.skills.join(", ")}`).join("\n");

    return {
        name: PERSONAL.name,
        title: PERSONAL.tagline,
        bio: PERSONAL.bio,
        repoCount: repos.length,
        repoNames,
        recentActivity,
        skills,
    };
}

/**
 * Generate content using Gemini API
 */
async function generateWithGemini(context: Awaited<ReturnType<typeof buildContext>>): Promise<typeof FALLBACK_CONTENT | null> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.log("No GEMINI_API_KEY found, using fallback content");
        return null;
    }

    const prompt = `Generate tabloid newspaper content as JSON.

DEVELOPER: ${context.name} - ${context.title}
SKILLS: ${context.skills}
RECENT REPOS: ${context.repoNames}
RECENT COMMITS: ${context.recentActivity || "None (dramatic absence!)"}

STYLE: 1920s tabloid + The Onion. Absurdly dramatic about coding. Developer humor.

RESPOND WITH ONLY THIS JSON (no markdown, no code blocks):
{"headline":"ALL CAPS HEADLINE","subheadline":"Witty secondary headline","bodyContent":["Dramatic paragraph 1","Paragraph 2","Paragraph 3"],"pullQuote":"Funny quote from developer"}`;

    try {
        const response = await fetch(`${GEMINI_API_URL}/${MODEL}:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.9,
                    maxOutputTokens: 2048,
                    responseMimeType: "application/json", // Force JSON output
                },
            }),
        });

        if (!response.ok) {
            console.error("Gemini API error:", response.status, await response.text());
            return null;
        }

        const data: GeminiResponse = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            console.error("No content in Gemini response");
            return null;
        }

        // Remove markdown code blocks if present
        let cleanText = text
            .replace(/```json\s*/gi, "")
            .replace(/```\s*/g, "")
            .trim();

        // Try to find a complete JSON object
        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error("No JSON found in response:", text.substring(0, 200));
            return null;
        }

        try {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                headline: parsed.headline || FALLBACK_CONTENT.headline,
                subheadline: parsed.subheadline || FALLBACK_CONTENT.subheadline,
                bodyContent: JSON.stringify(parsed.bodyContent || JSON.parse(FALLBACK_CONTENT.bodyContent)),
                pullQuote: parsed.pullQuote || FALLBACK_CONTENT.pullQuote,
            };
        } catch (parseError) {
            console.error("JSON parse failed, response may be truncated:", text.substring(0, 300));
            return null;
        }
    } catch (error) {
        console.error("Failed to generate with Gemini:", error);
        return null;
    }
}

/**
 * GET: Retrieve active edition for today or specific edition by ID
 * Priority: 1) Specific ID 2) Active for today 3) Any active 4) Any fallback
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        // If ID is provided, fetch that specific edition
        if (id) {
            const edition = await prisma.newspaperEdition.findUnique({
                where: { id },
            });
            if (edition) {
                return NextResponse.json({
                    ...edition,
                    bodyContent: JSON.parse(edition.bodyContent),
                });
            }
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);

        // 1. Try to get active edition for today
        let edition = await prisma.newspaperEdition.findFirst({
            where: {
                date: { gte: today, lte: todayEnd },
                isActive: true,
            },
        });

        // 2. Try any active edition
        if (!edition) {
            edition = await prisma.newspaperEdition.findFirst({
                where: { isActive: true },
                orderBy: { date: "desc" },
            });
        }

        // 3. Try any fallback
        if (!edition) {
            edition = await prisma.newspaperEdition.findFirst({
                where: { isFallback: true },
                orderBy: { date: "desc" },
            });
        }

        if (!edition) {
            // Return hardcoded fallback
            return NextResponse.json({
                ...FALLBACK_CONTENT,
                bodyContent: JSON.parse(FALLBACK_CONTENT.bodyContent),
                date: today.toISOString(),
                isFallback: true,
            });
        }

        return NextResponse.json({
            ...edition,
            bodyContent: JSON.parse(edition.bodyContent),
        });
    } catch (error) {
        console.error("Failed to get newspaper edition:", error);
        return NextResponse.json({
            ...FALLBACK_CONTENT,
            bodyContent: JSON.parse(FALLBACK_CONTENT.bodyContent),
            date: new Date().toISOString(),
            isFallback: true,
        });
    }
}

/**
 * POST: Generate new edition variant (admin only)
 * Creates a NEW edition (doesn't replace existing) and sets it as active
 */
export async function POST(request: Request) {
    try {
        // Check for admin cookie (simple auth check)
        const authCookie = request.headers.get("cookie")?.includes("admin_session");
        if (!authCookie) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const context = await buildContext();
        const generated = await generateWithGemini(context);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);

        const content = generated || FALLBACK_CONTENT;

        // Deactivate all editions for today
        await prisma.newspaperEdition.updateMany({
            where: {
                date: { gte: today, lte: todayEnd },
            },
            data: { isActive: false },
        });

        // Create new edition (variant) and set as active
        const edition = await prisma.newspaperEdition.create({
            data: {
                date: today,
                headline: content.headline,
                subheadline: content.subheadline,
                bodyContent: typeof content.bodyContent === "string"
                    ? content.bodyContent
                    : JSON.stringify(content.bodyContent),
                pullQuote: content.pullQuote,
                isActive: true, // Auto-activate new edition
                isFallback: false, // Never fallback - this is admin-generated for today
                generatedBy: generated ? MODEL : "fallback-content",
            },
        });

        return NextResponse.json({
            success: true,
            ...edition,
            bodyContent: JSON.parse(edition.bodyContent),
        });
    } catch (error) {
        console.error("Failed to generate newspaper edition:", error);
        return NextResponse.json(
            { error: "Failed to generate edition" },
            { status: 500 }
        );
    }
}
