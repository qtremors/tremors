/**
 * Cron API: Scheduled GitHub Refresh
 * Triggers automatic refresh at 12AM, 8AM, 4PM (every 8 hours)
 * 
 * For Vercel: Add to vercel.json:
 * {
 *   "crons": [
 *     { "path": "/api/cron/refresh", "schedule": "0 0,8,16 * * *" }
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
import type { GitHubEvent } from "@/types";

const GITHUB_USERNAME = process.env.GITHUB_USERNAME || "qtremors";

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

export async function GET(request: NextRequest) {
    // Verify authorization
    if (!verifyCronSecret(request)) {
        return NextResponse.json(
            { success: false, error: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
        console.log("[CRON] Starting scheduled GitHub refresh...");

        // Fetch all data from GitHub
        const repos = await getRepos(GITHUB_USERNAME);

        // Safety check
        if (repos.length === 0) {
            console.log("[CRON] GitHub returned empty repos - skipping refresh");
            return NextResponse.json({
                success: false,
                error: "GitHub API returned no repos",
            });
        }

        const commits = await getRecentCommits(repos, 50);
        const events = await getActivity(GITHUB_USERNAME, 30);

        // Use transaction for data integrity
        await prisma.$transaction(async (tx) => {
            // Get current repo IDs
            const githubRepoIds = repos.map((repo) => repo.id);

            // Delete repos no longer on GitHub
            await tx.repo.deleteMany({
                where: { id: { notIn: githubRepoIds } },
            });

            // Upsert all repos (preserving admin settings)
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

            // Replace commits
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

            // Replace activity (excluding PushEvents - handled by commits)
            await tx.activity.deleteMany({});
            const activityData = events
                .filter((e: GitHubEvent) => e.type !== "PushEvent")
                .map((event: GitHubEvent) => eventToDbActivity(event))
                .filter((item): item is NonNullable<typeof item> => item !== null);

            if (activityData.length > 0) {
                await tx.activity.createMany({ data: activityData });
            }

            // Update last refresh timestamp
            await tx.settings.upsert({
                where: { id: "main" },
                update: { lastRefresh: new Date() },
                create: { id: "main", lastRefresh: new Date() },
            });
        }, {
            maxWait: 10000,
            timeout: 30000,
        });

        console.log(`[CRON] Refresh complete: ${repos.length} repos, ${commits.length} commits`);

        return NextResponse.json({
            success: true,
            message: `Scheduled refresh: ${repos.length} repos, ${commits.length} commits`,
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
