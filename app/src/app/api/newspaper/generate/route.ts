/**
 * API Route: /api/newspaper/generate
 * Generates hilarious daily newspaper content using Gemini AI
 * Falls back to stored content if API unavailable
 */

import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { PERSONAL, SKILLS, NEWS_AGENT } from "@/config/site";
import { verifyAdminCookie } from "@/lib/auth";
import { validateCsrf } from "@/lib/csrf";
import {
    getISTDateString,
    getISTParts,
    getStartOfDayIST,
    getEndOfDayIST,
    formatIST
} from "@/lib/date";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const MODEL = "gemini-flash-lite-latest"; // Latest flash lite model

interface GeminiResponse {
    candidates?: Array<{
        content: {
            parts: Array<{ text: string }>;
        };
    }>;
}

/**
 * Build rich context for Skye about the developer's last 24 hours AND global history
 * Timezone: Asia/Kolkata (GMT+5:30)
 */
async function buildContext() {
    // Current time in IST
    const now = new Date();
    const timeZone = "Asia/Kolkata";

    // Helper to format date in IST
    const getISTDate = (date: Date) => formatIST(date, {
        year: "numeric", month: "numeric", day: "numeric",
        hour: "numeric", minute: "numeric", hour12: false
    });

    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch all repos (Global Context)
    const allRepos = await prisma.repo.findMany({
        where: { hidden: false },
        orderBy: { pushedAt: "desc" },
    });

    // Fetch all commits (Historical Context for streaks/active repo)
    const recentCommits = await prisma.commit.findMany({
        orderBy: { date: "desc" },
        take: 100, // Increased for weekly depth
    });

    // Fetch Strictly Weekly data (7 days)
    const [weeklyCommits, weeklyActivity, previousEditions] = await Promise.all([
        prisma.commit.findMany({
            where: { date: { gte: sevenDaysAgo } },
            orderBy: { date: "desc" },
        }),
        prisma.activity.findMany({
            where: { date: { gte: sevenDaysAgo } },
            orderBy: { date: "desc" },
        }),
        prisma.newspaperEdition.findMany({
            where: { 
                id: { gte: "" }, // Bypass Postgres cached plans for JSONB migration
                isActive: true 
            },
            orderBy: { date: "desc" },
            take: 5,
            select: { headline: true, date: true }
        })
    ]);

    // === GLOBAL REPO STATS (History) ===
    const repoCount = allRepos.length;
    const totalStars = allRepos.reduce((sum, r) => sum + r.stars, 0);
    const featuredRepos = allRepos.filter(r => r.featured).map(r => r.name);

    // Top languages
    const langCounts: Record<string, number> = {};
    allRepos.forEach(r => {
        if (r.language) langCounts[r.language] = (langCounts[r.language] || 0) + 1;
    });
    const topLanguages = Object.entries(langCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([lang, count]) => `${lang} (${count})`);

    // Memory: Oldest active repo
    const oldestActiveRepo = allRepos
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];

    // === WEEKLY ACTIVITY (Last 7 Days) ===
    const mostActiveRepoWeekly = Object.entries(
        weeklyCommits.reduce((acc, c) => {
            acc[c.repoName] = (acc[c.repoName] || 0) + 1;
            return acc;
        }, {} as Record<string, number>)
    ).sort((a, b) => b[1] - a[1])[0];

    // Group commits by day for better temporal reading
    const commitsByDay: Record<string, string[]> = {};
    weeklyCommits.forEach(c => {
        const day = getISTDateString(new Date(c.date));
        if (!commitsByDay[day]) commitsByDay[day] = [];
        if (commitsByDay[day].length < 15) { // Max 15 per day for better detail
            commitsByDay[day].push(`${c.repoName}: ${c.message}`);
        }
    });

    const weeklySummary = Object.entries(commitsByDay)
        .slice(0, 7)
        .map(([day, msgs]) => `[${day}]\n${msgs.map(m => `- ${m}`).join("\n")}`)
        .join("\n\n");

    // Streak Check
    const commitDates = new Set(recentCommits.map(c => getISTDateString(new Date(c.date))));
    let streak = 0;
    const todayIST = getISTDateString(now);
    let checkDateObj = new Date(now);

    while (true) {
        const dateStr = getISTDateString(checkDateObj);
        if (commitDates.has(dateStr)) {
            streak++;
            checkDateObj.setDate(checkDateObj.getDate() - 1);
        } else {
            if (streak === 0 && dateStr === todayIST) {
                checkDateObj.setDate(checkDateObj.getDate() - 1);
                continue;
            }
            break;
        }
    }

    // === CALENDAR ===
    const todayDateStr = formatIST(now, {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    const { month, day } = getISTParts(now);
    const holidays: string[] = [];
    if (month === 1 && day === 1) holidays.push("New Year's Day");
    if (month === 10 && day === 31) holidays.push("Halloween");
    if (month === 12 && day === 25) holidays.push("Christmas");

    // Dynamically fetch Indian holidays
    try {
        const year = now.getFullYear();
        // Fallback for festive season
        if ((month === 10 || month === 11) && day >= 20 && day <= 31) {
             const diwaliDates: Record<number, string> = {
                 2024: "10-31", 2025: "10-20", 2026: "11-08", 2027: "10-29",
                 2028: "10-17", 2029: "11-05", 2030: "10-26"
             };
             const todayStr = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
             if (diwaliDates[year] === todayStr) {
                 holidays.push("Diwali");
             } else {
                 holidays.push("Festive Season");
             }
        }
    } catch (e) {
        // Ignore errors
    }

    return {
        name: PERSONAL.name,
        todayDate: todayDateStr + " (IST)",
        holidays: holidays.length > 0 ? holidays.join(", ") : null,

        // Global Context
        repoCount,
        totalStars,
        topLanguages: topLanguages.join(", "),
        featuredRepos: featuredRepos.join(", "),
        oldestActiveRepo: oldestActiveRepo ? `${oldestActiveRepo.name} (since ${new Date(oldestActiveRepo.createdAt).getFullYear()})` : "None",

        // Weekly Context (7 Days)
        weeklyActivity: {
            commitCount: weeklyCommits.length,
            eventCount: weeklyActivity.length,
            mostActiveRepo: mostActiveRepoWeekly ? mostActiveRepoWeekly[0] : null,
            summary: weeklySummary || "Minimal activity this week.",
        },

        // Awareness of Previous Content
        recentHeadlines: previousEditions.map(e => `("${e.headline}" on ${getISTDateString(new Date(e.date))})`),

        streak: streak > 1 ? `${streak} days` : null,
        skills: SKILLS.map(s => s.skills.slice(0, 3).join(", ")).join(" | "),
    };
}

/**
 * Generate content using Gemini API
 */
async function generateWithGemini(
    context: Awaited<ReturnType<typeof buildContext>>,
    personalityId: string = "tabloid"
): Promise<{ headline: string, subheadline: string, bodyContent: string, pullQuote: string, location: string } | null> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    const personality = NEWS_AGENT.personalities.find(p => p.id === personalityId) || NEWS_AGENT.personalities[0];

    const prompt = `You are ${NEWS_AGENT.name}, an AI news agent.
Current Time: ${context.todayDate}
Style/Personality: ${personality.prompt}

=== WEEKLY RECAP (LAST 7 DAYS in IST) ===
Total Commits this week: ${context.weeklyActivity.commitCount}
Total Events this week: ${context.weeklyActivity.eventCount}
Most Involved Repo this week: ${context.weeklyActivity.mostActiveRepo || "None"}

DETAILED WEEKLY LOG:
${context.weeklyActivity.summary}

=== PREVIOUS NEWS HEADLINES (DO NOT REPEAT THESE) ===
${context.recentHeadlines.length > 0 ? context.recentHeadlines.join("\n") : "None (First edition of the week!)"}

=== HISTORICAL PROFILE (THE BIG PICTURE) ===
Total Repos: ${context.repoCount} (Stars: ${context.totalStars})
Top Languages: ${context.topLanguages}
Featured Projects: ${context.featuredRepos}
Oldest Project: ${context.oldestActiveRepo}
Current Streak: ${context.streak || "No active streak"}

=== GLOBAL CONTEXT ===
Developer: ${context.name}
${context.holidays ? `Special Occasion: ${context.holidays}` : ""}
Skills: ${context.skills}

INSTRUCTIONS:
Generate a newspaper edition in JSON.
1. Use the provided WEEKLY context to generate a fresh, relevant story.
2. Adopt the persona of ${personality.name} strictly.
3. DO NOT repeat the narrative or jokes from the PREVIOUS NEWS HEADLINES provided above.
4. Reference specific repos, commit messages, and dates from the log to make the story feel authentic.

RESPOND ONLY WITH VALID JSON:
{"headline":"...","subheadline":"...","bodyContent":["...","...","..."],"pullQuote":"...","location":"..."}`;

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
                headline: parsed.headline || "DEVELOPER SILENT, SERVERS HUMMING",
                subheadline: parsed.subheadline || "No new updates from the void",
                bodyContent: parsed.bodyContent || ["The central nexus reports no new structural paradigm shifts. Assume standard operating procedures."],
                pullQuote: parsed.pullQuote || '"Just keep swimming." — Dory',
                location: parsed.location || "VØID",
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
            const edition = await prisma.newspaperEdition.findFirst({
                where: { id: id },
            });
            if (edition) {
                return NextResponse.json({
                    ...edition,
                    bodyContent: edition.bodyContent,
                });
            }
        }

        const todayStart = getStartOfDayIST();
        const todayEnd = getEndOfDayIST();

        // 1. Try to get active edition for today
        let edition = await prisma.newspaperEdition.findFirst({
            where: {
                id: { gte: "" }, // Bypass Postgres cached plans
                date: { gte: todayStart, lte: todayEnd },
                isActive: true,
            },
        });

        // 2. Try any active edition
        if (!edition) {
            edition = await prisma.newspaperEdition.findFirst({
                where: { id: { gte: "" }, isActive: true },
                orderBy: { date: "desc" },
            });
        }

        // 3. Try any fallback
        if (!edition) {
            edition = await prisma.newspaperEdition.findFirst({
                where: { id: { gte: "" }, isFallback: true },
                orderBy: { date: "desc" },
            });
        }

        if (!edition) {
            // Return dummy fallback if DB is completely empty
            return NextResponse.json({
                headline: "AWAITING FIRST EDITION",
                subheadline: "The presses are warming up",
                bodyContent: ["No newspaper editions have been published yet."],
                pullQuote: "Patience is a virtue.",
                location: "VØID",
                date: todayStart.toISOString(),
                isFallback: true,
            });
        }

        return NextResponse.json({
            ...edition,
            bodyContent: edition.bodyContent,
        });
    } catch (error) {
        console.error("Failed to get newspaper edition:", error);
        return NextResponse.json({
            headline: "TEMPORARY OUTAGE",
            subheadline: "We're experiencing technical difficulties",
            bodyContent: ["The newspaper delivery system encountered an error."],
            pullQuote: "Brb, fixing the printer.",
            location: "VØID",
            date: new Date().toISOString(),
            isFallback: true,
            agentName: NEWS_AGENT.name,
            personality: "tabloid"
        });
    }
}

/**
 * POST: Generate new edition variant (admin only)
 * Creates a NEW edition (doesn't replace existing) and sets it as active
 */
export async function POST(request: NextRequest) {
    try {
        // Verify admin session
        const isAdmin = await verifyAdminCookie();
        if (!isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Validate CSRF
        const csrf = validateCsrf(request);
        if (!csrf.valid) {
            return NextResponse.json(
                { success: false, error: csrf.error },
                { status: 403 }
            );
        }

        const body = await request.json().catch(() => ({}));
        const personalityId = body.personalityId || "tabloid";

        const context = await buildContext();
        const generated = await generateWithGemini(context, personalityId);

        const now = new Date();
        const startOfToday = getStartOfDayIST(now);
        const endOfToday = getEndOfDayIST(now);

        const content = generated;

        // If Gemini totally fails, DO NOT overwrite the active edition. Let the frontend show the latest historical paper instead.
        if (!content) {
            return NextResponse.json(
                { success: false, error: "Failed to generate content with Gemini. Keeping latest existing edition." },
                { status: 500 }
            );
        }

        // Deactivate all editions for today
        await prisma.newspaperEdition.updateMany({
            where: {
                id: { gte: "" },
                date: { gte: startOfToday, lte: endOfToday },
            },
            data: { isActive: false },
        });

        // Create new edition (variant) and set as active
        const edition = await prisma.newspaperEdition.create({
            data: {
                date: now, // Store the exact generation time
                headline: content.headline,
                subheadline: content.subheadline,
                bodyContent: content.bodyContent,
                pullQuote: content.pullQuote,
                location: content.location || "VØID",
                isActive: true, // Auto-activate new edition
                isFallback: false,
                generatedBy: generated ? MODEL : "fallback-content",
                agentName: NEWS_AGENT.name,
                personality: personalityId,
            },
        });

        return NextResponse.json({
            success: true,
            ...edition,
            bodyContent: edition.bodyContent,
        });
    } catch (error) {
        console.error("Failed to generate newspaper edition:", error);
        return NextResponse.json(
            { success: false, error: "Failed to generate edition" },
            { status: 500 }
        );
    }
}
