/**
 * Cron API: Scheduled GitHub Refresh + Newspaper Generation
 * Triggers automatic refresh at 12AM IST daily
 * 
 * For Vercel: Add to vercel.json:
 * {
 *   "crons": [
 *     { "path": "/api/cron/refresh", "schedule": "30 18 * * *" }
 *   ]
 * }
 * 
 * For external cron: Call this endpoint at scheduled times
 * Security: Validates CRON_SECRET env var
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRepos, getRecentCommits, getActivity } from "@/lib/github";
import { eventToDbActivity } from "@/lib/activity";
import { PERSONAL, SKILLS } from "@/config/site";
import type { GitHubEvent } from "@/types";

const GITHUB_USERNAME = process.env.GITHUB_USERNAME || "qtremors";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const MODEL = "gemini-flash-lite-latest";

// Verify cron secret for security
function verifyCronSecret(request: NextRequest): boolean {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // If no CRON_SECRET set, allow in development only
    if (!cronSecret) {
        return process.env.NODE_ENV === "development";
    }

    return authHeader === `Bearer ${cronSecret}`;
}

// Fallback newspaper content
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

// Build context for Gemini
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

// Generate content using Gemini API
async function generateWithGemini(context: Awaited<ReturnType<typeof buildContext>>): Promise<typeof FALLBACK_CONTENT | null> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.log("[CRON] No GEMINI_API_KEY found, using fallback content");
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
                    responseMimeType: "application/json",
                },
            }),
        });

        if (!response.ok) {
            console.error("[CRON] Gemini API error:", response.status);
            return null;
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) return null;

        const cleanText = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;

        const parsed = JSON.parse(jsonMatch[0]);
        return {
            headline: parsed.headline || FALLBACK_CONTENT.headline,
            subheadline: parsed.subheadline || FALLBACK_CONTENT.subheadline,
            bodyContent: JSON.stringify(parsed.bodyContent || JSON.parse(FALLBACK_CONTENT.bodyContent)),
            pullQuote: parsed.pullQuote || FALLBACK_CONTENT.pullQuote,
        };
    } catch (error) {
        console.error("[CRON] Gemini generation failed:", error);
        return null;
    }
}

export async function GET(request: NextRequest) {
    // Verify authorization
    if (!verifyCronSecret(request)) {
        return NextResponse.json(
            { success: false, error: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
        console.log("[CRON] Starting scheduled refresh...");

        // ========== GITHUB REFRESH ==========
        const repos = await getRepos(GITHUB_USERNAME);

        if (repos.length === 0) {
            console.log("[CRON] GitHub returned empty repos - skipping refresh");
            return NextResponse.json({
                success: false,
                error: "GitHub API returned no repos",
            });
        }

        const commits = await getRecentCommits(repos, 50);
        const events = await getActivity(GITHUB_USERNAME, 30);

        await prisma.$transaction(async (tx) => {
            const githubRepoIds = repos.map((repo) => repo.id);

            await tx.repo.deleteMany({
                where: { id: { notIn: githubRepoIds } },
            });

            await Promise.all(
                repos.map((repo) =>
                    tx.repo.upsert({
                        where: { id: repo.id },
                        update: {
                            name: repo.name,
                            fullName: repo.full_name,
                            description: repo.description,
                            htmlUrl: repo.html_url,
                            homepage: repo.homepage,
                            stars: repo.stargazers_count,
                            forks: repo.forks_count,
                            language: repo.language,
                            topics: JSON.stringify(repo.topics),
                            pushedAt: new Date(repo.pushed_at),
                            createdAt: new Date(repo.created_at),
                        },
                        create: {
                            id: repo.id,
                            name: repo.name,
                            fullName: repo.full_name,
                            description: repo.description,
                            htmlUrl: repo.html_url,
                            homepage: repo.homepage,
                            stars: repo.stargazers_count,
                            forks: repo.forks_count,
                            language: repo.language,
                            topics: JSON.stringify(repo.topics),
                            pushedAt: new Date(repo.pushed_at),
                            createdAt: new Date(repo.created_at),
                            hidden: false,
                            featured: false,
                        },
                    })
                )
            );

            await tx.commit.deleteMany({});
            await tx.commit.createMany({
                data: commits.map((commit) => ({
                    sha: commit.sha,
                    message: commit.message,
                    date: new Date(commit.date),
                    repoName: commit.repoName,
                    repoUrl: commit.repoUrl,
                    author: commit.author,
                })),
            });

            await tx.activity.deleteMany({});
            const activityData = events
                .filter((e: GitHubEvent) => e.type !== "PushEvent")
                .map((event: GitHubEvent) => eventToDbActivity(event))
                .filter((item): item is NonNullable<typeof item> => item !== null);

            if (activityData.length > 0) {
                await tx.activity.createMany({ data: activityData });
            }

            await tx.settings.upsert({
                where: { id: "main" },
                update: { lastRefresh: new Date() },
                create: { id: "main", lastRefresh: new Date() },
            });
        }, {
            maxWait: 10000,
            timeout: 30000,
        });

        console.log(`[CRON] GitHub refresh complete: ${repos.length} repos, ${commits.length} commits`);

        // ========== NEWSPAPER GENERATION ==========
        let newspaperGenerated = false;
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayEnd = new Date(today);
            todayEnd.setHours(23, 59, 59, 999);

            // Check if we already have an edition for today
            const existingEdition = await prisma.newspaperEdition.findFirst({
                where: {
                    date: { gte: today, lte: todayEnd },
                    isFallback: false,
                },
            });

            if (!existingEdition) {
                console.log("[CRON] Generating newspaper edition...");

                const context = await buildContext();
                const generated = await generateWithGemini(context);
                const content = generated || FALLBACK_CONTENT;

                // Deactivate previous active editions
                await prisma.newspaperEdition.updateMany({
                    where: { isActive: true },
                    data: { isActive: false },
                });

                // Create new edition
                await prisma.newspaperEdition.create({
                    data: {
                        date: today,
                        headline: content.headline,
                        subheadline: content.subheadline,
                        bodyContent: content.bodyContent,
                        pullQuote: content.pullQuote,
                        isActive: true,
                        isFallback: false,
                        generatedBy: generated ? MODEL : "cron-fallback",
                    },
                });

                newspaperGenerated = true;
                console.log("[CRON] Newspaper edition generated!");
            } else {
                console.log("[CRON] Newspaper edition already exists for today");
            }
        } catch (newsError) {
            console.error("[CRON] Newspaper generation failed:", newsError);
        }

        return NextResponse.json({
            success: true,
            message: `Refresh: ${repos.length} repos, ${commits.length} commits${newspaperGenerated ? ", new newspaper edition" : ""}`,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("[CRON] Refresh error:", error);
        return NextResponse.json(
            { success: false, error: "Scheduled refresh failed" },
            { status: 500 }
        );
    }
}
