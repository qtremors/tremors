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
    location: "VØID",
};

interface GeminiResponse {
    candidates?: Array<{
        content: {
            parts: Array<{ text: string }>;
        };
    }>;
}

/**
 * Build rich context for Gemini about the developer
 */
async function buildContext() {
    const now = new Date();

    // Fetch all repos and commits
    const allRepos = await prisma.repo.findMany({
        where: { hidden: false },
        orderBy: { pushedAt: "desc" },
    });

    const allCommits = await prisma.commit.findMany({
        orderBy: { date: "desc" },
        take: 30,
    });

    // === REPO STATS ===
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

    // Most active repo (most commits in last 30)
    const commitsByRepo: Record<string, number> = {};
    allCommits.forEach(c => {
        commitsByRepo[c.repoName] = (commitsByRepo[c.repoName] || 0) + 1;
    });
    const mostActiveRepo = Object.entries(commitsByRepo)
        .sort((a, b) => b[1] - a[1])[0];

    // Least active repos (no commits in 30+ days)
    const recentRepoNames = new Set(allCommits.map(c => c.repoName));
    const dormantRepos = allRepos
        .filter(r => !recentRepoNames.has(r.name))
        .slice(0, 3)
        .map(r => {
            const daysDormant = Math.floor((now.getTime() - new Date(r.pushedAt).getTime()) / (1000 * 60 * 60 * 24));
            return `${r.name} (${daysDormant} days)`;
        });

    // Repo age vs activity (oldest repo still active)
    const oldestActiveRepo = allRepos
        .filter(r => recentRepoNames.has(r.name))
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];

    // === COMMIT PATTERNS ===
    const recentActivity = allCommits.slice(0, 10)
        .map(c => `${c.repoName}: ${c.message}`)
        .join("\n");

    // Time of last commit
    const lastCommit = allCommits[0];
    const lastCommitDate = lastCommit ? new Date(lastCommit.date) : null;
    const daysSinceLastCommit = lastCommitDate
        ? Math.floor((now.getTime() - lastCommitDate.getTime()) / (1000 * 60 * 60 * 24))
        : null;
    const lastCommitHour = lastCommitDate?.getHours();
    const lastCommitTimeOfDay = lastCommitHour !== undefined
        ? (lastCommitHour >= 0 && lastCommitHour < 6 ? "late night (midnight-6am)"
            : lastCommitHour < 12 ? "morning"
                : lastCommitHour < 18 ? "afternoon"
                    : "evening")
        : null;

    // Commit streak (consecutive days with commits)
    const commitDates = new Set(allCommits.map(c =>
        new Date(c.date).toISOString().split('T')[0]
    ));
    let streak = 0;
    const today = now.toISOString().split('T')[0];
    let checkDate = new Date(now);
    while (commitDates.has(checkDate.toISOString().split('T')[0]) ||
        (streak === 0 && checkDate.toISOString().split('T')[0] === today)) {
        if (commitDates.has(checkDate.toISOString().split('T')[0])) streak++;
        checkDate.setDate(checkDate.getDate() - 1);
        if (streak > 30) break; // Cap at 30
    }

    // === CALENDAR AWARENESS ===
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;

    // Holiday detection (major holidays)
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const holidays: string[] = [];
    if (month === 1 && day === 1) holidays.push("New Year's Day");
    if (month === 2 && day === 14) holidays.push("Valentine's Day");
    if (month === 10 && day === 31) holidays.push("Halloween");
    if (month === 12 && day === 24) holidays.push("Christmas Eve");
    if (month === 12 && day === 25) holidays.push("Christmas Day");
    if (month === 12 && day === 31) holidays.push("New Year's Eve");
    // Diwali (approximate - late Oct/Nov)
    if (month === 10 || month === 11) {
        if (day >= 20 && day <= 31) holidays.push("Diwali season");
    }

    const skills = SKILLS.map(s => `${s.id}: ${s.skills.join(", ")}`).join("\n");

    return {
        // Developer info
        name: PERSONAL.name,
        title: PERSONAL.tagline,

        // Calendar
        todayDate: now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        dayOfWeek,
        isWeekend,
        holidays: holidays.length > 0 ? holidays.join(", ") : null,

        // Repo stats
        repoCount,
        totalStars,
        featuredRepos: featuredRepos.length > 0 ? featuredRepos.join(", ") : null,
        topLanguages: topLanguages.join(", "),
        mostActiveRepo: mostActiveRepo ? `${mostActiveRepo[0]} (${mostActiveRepo[1]} recent commits)` : null,
        dormantRepos: dormantRepos.length > 0 ? dormantRepos.join(", ") : null,
        oldestActiveRepo: oldestActiveRepo
            ? `${oldestActiveRepo.name} (created ${Math.floor((now.getTime() - new Date(oldestActiveRepo.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days ago, still active!)`
            : null,

        // Commit patterns
        recentCommits: recentActivity,
        daysSinceLastCommit,
        lastCommitTimeOfDay,
        commitStreak: streak > 1 ? `${streak} days` : null,

        // Skills
        skills,
    };
}

/**
 * Generate content using Gemini API
 */
async function generateWithGemini(context: Awaited<ReturnType<typeof buildContext>>): Promise<typeof FALLBACK_CONTENT | null> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return null; // Use fallback content
    }

    const prompt = `Generate tabloid newspaper content as JSON.

=== CALENDAR ===
TODAY: ${context.todayDate}
DAY: ${context.dayOfWeek}${context.isWeekend ? " (WEEKEND!)" : ""}
${context.holidays ? `HOLIDAY: ${context.holidays}` : ""}

=== DEVELOPER ===
NAME: ${context.name} - ${context.title}
SKILLS: ${context.skills}

=== REPO STATS ===
TOTAL REPOS: ${context.repoCount}
TOTAL STARS: ${context.totalStars}
TOP LANGUAGES: ${context.topLanguages}
${context.featuredRepos ? `FEATURED: ${context.featuredRepos}` : ""}
${context.mostActiveRepo ? `MOST ACTIVE: ${context.mostActiveRepo}` : ""}
${context.dormantRepos ? `DORMANT REPOS: ${context.dormantRepos}` : ""}
${context.oldestActiveRepo ? `OLDEST ACTIVE: ${context.oldestActiveRepo}` : ""}

=== ACTIVITY ===
DAYS SINCE LAST COMMIT: ${context.daysSinceLastCommit ?? "unknown"}
${context.lastCommitTimeOfDay ? `LAST COMMIT TIME: ${context.lastCommitTimeOfDay}` : ""}
${context.commitStreak ? `COMMIT STREAK: ${context.commitStreak}` : ""}
RECENT COMMITS:
${context.recentCommits || "None"}

STYLE: 1920s tabloid + The Onion. Absurdly dramatic about coding. Developer humor. Use ALL the context creatively - holidays, streaks, dormant repos, late night commits, etc.

RESPOND WITH ONLY THIS JSON (no markdown, no code blocks):
{"headline":"ALL CAPS HEADLINE","subheadline":"Witty secondary headline","bodyContent":["Dramatic paragraph 1","Paragraph 2","Paragraph 3"],"pullQuote":"Funny quote from developer","location":"Creative nerdy location like 'localhost:3000', '127.0.0.1', '/dev/null', 'The Stack', 'Buffer Zone', etc."}`;

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
                location: parsed.location || FALLBACK_CONTENT.location,
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
                location: content.location || "VØID",
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
