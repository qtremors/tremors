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

// Build rich context for Gemini
async function buildContext() {
    const now = new Date();

    const allRepos = await prisma.repo.findMany({
        where: { hidden: false },
        orderBy: { pushedAt: "desc" },
    });

    const allCommits = await prisma.commit.findMany({
        orderBy: { date: "desc" },
        take: 30,
    });

    // Repo stats
    const repoCount = allRepos.length;
    const totalStars = allRepos.reduce((sum, r) => sum + r.stars, 0);
    const featuredRepos = allRepos.filter(r => r.featured).map(r => r.name);

    const langCounts: Record<string, number> = {};
    allRepos.forEach(r => {
        if (r.language) langCounts[r.language] = (langCounts[r.language] || 0) + 1;
    });
    const topLanguages = Object.entries(langCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([lang, count]) => `${lang} (${count})`);

    const commitsByRepo: Record<string, number> = {};
    allCommits.forEach(c => { commitsByRepo[c.repoName] = (commitsByRepo[c.repoName] || 0) + 1; });
    const mostActiveRepo = Object.entries(commitsByRepo).sort((a, b) => b[1] - a[1])[0];

    const recentRepoNames = new Set(allCommits.map(c => c.repoName));
    const dormantRepos = allRepos.filter(r => !recentRepoNames.has(r.name)).slice(0, 3).map(r => {
        const daysDormant = Math.floor((now.getTime() - new Date(r.pushedAt).getTime()) / (1000 * 60 * 60 * 24));
        return `${r.name} (${daysDormant} days)`;
    });

    const oldestActiveRepo = allRepos.filter(r => recentRepoNames.has(r.name)).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];

    // Commit patterns
    const recentActivity = allCommits.slice(0, 10).map(c => `${c.repoName}: ${c.message}`).join("\n");
    const lastCommit = allCommits[0];
    const lastCommitDate = lastCommit ? new Date(lastCommit.date) : null;
    const daysSinceLastCommit = lastCommitDate ? Math.floor((now.getTime() - lastCommitDate.getTime()) / (1000 * 60 * 60 * 24)) : null;
    const lastCommitHour = lastCommitDate?.getHours();
    const lastCommitTimeOfDay = lastCommitHour !== undefined
        ? (lastCommitHour >= 0 && lastCommitHour < 6 ? "late night (midnight-6am)" : lastCommitHour < 12 ? "morning" : lastCommitHour < 18 ? "afternoon" : "evening")
        : null;

    const commitDates = new Set(allCommits.map(c => new Date(c.date).toISOString().split('T')[0]));
    let streak = 0;
    let checkDate = new Date(now);
    const today = now.toISOString().split('T')[0];
    while (commitDates.has(checkDate.toISOString().split('T')[0]) || (streak === 0 && checkDate.toISOString().split('T')[0] === today)) {
        if (commitDates.has(checkDate.toISOString().split('T')[0])) streak++;
        checkDate.setDate(checkDate.getDate() - 1);
        if (streak > 30) break;
    }

    // Calendar
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const holidays: string[] = [];
    if (month === 1 && day === 1) holidays.push("New Year's Day");
    if (month === 12 && day === 24) holidays.push("Christmas Eve");
    if (month === 12 && day === 25) holidays.push("Christmas Day");
    if (month === 12 && day === 31) holidays.push("New Year's Eve");

    return {
        name: PERSONAL.name, title: PERSONAL.tagline,
        todayDate: now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        dayOfWeek, isWeekend, holidays: holidays.length > 0 ? holidays.join(", ") : null,
        repoCount, totalStars, featuredRepos: featuredRepos.length > 0 ? featuredRepos.join(", ") : null,
        topLanguages: topLanguages.join(", "),
        mostActiveRepo: mostActiveRepo ? `${mostActiveRepo[0]} (${mostActiveRepo[1]} recent commits)` : null,
        dormantRepos: dormantRepos.length > 0 ? dormantRepos.join(", ") : null,
        oldestActiveRepo: oldestActiveRepo ? `${oldestActiveRepo.name} (created ${Math.floor((now.getTime() - new Date(oldestActiveRepo.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days ago)` : null,
        recentCommits: recentActivity, daysSinceLastCommit, lastCommitTimeOfDay,
        commitStreak: streak > 1 ? `${streak} days` : null,
        skills: SKILLS.map(s => `${s.id}: ${s.skills.join(", ")}`).join("\n"),
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

STYLE: 1920s tabloid + The Onion. Absurdly dramatic about coding. Developer humor. Use ALL the context creatively.

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
