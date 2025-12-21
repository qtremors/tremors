import { getUser, getActivity } from "@/lib/github";
import { prisma } from "@/lib/db";
import { parseTopics } from "@/lib/utils";
import type { PortfolioData, GitHubEvent, GitHubCommit, ActivityItem } from "@/types";
import type { GitHubRepo } from "@/lib/github";

// GitHub username - can be configured via env
const GITHUB_USERNAME = process.env.GITHUB_USERNAME || "qtremors";

// Convert DB repo to GitHub repo format
function dbRepoToGitHubFormat(dbRepo: {
    id: number;
    name: string;
    fullName: string;
    description: string | null;
    htmlUrl: string;
    homepage: string | null;
    stars: number;
    forks: number;
    language: string | null;
    topics: string;
    pushedAt: Date;
    createdAt: Date;
    customName: string | null;
    customDescription: string | null;
    featured: boolean;
    order: number;
    hidden: boolean;
}): GitHubRepo {
    return {
        id: dbRepo.id,
        name: dbRepo.customName || dbRepo.name,
        full_name: dbRepo.fullName,
        description: dbRepo.customDescription || dbRepo.description,
        html_url: dbRepo.htmlUrl,
        homepage: dbRepo.homepage,
        stargazers_count: dbRepo.stars,
        forks_count: dbRepo.forks,
        language: dbRepo.language,
        topics: parseTopics(dbRepo.topics, dbRepo.name),
        pushed_at: dbRepo.pushedAt.toISOString(),
        created_at: dbRepo.createdAt.toISOString(),
        fork: false,
        // Include admin properties for all users
        featured: dbRepo.featured,
        order: dbRepo.order,
        hidden: dbRepo.hidden,
    };
}

// Convert events to ActivityItems
function eventToActivityItem(event: GitHubEvent): ActivityItem | null {
    const repoName = event.repo.name.split("/")[1] || event.repo.name;
    const repoUrl = `https://github.com/${event.repo.name}`;

    switch (event.type) {
        case "CreateEvent":
            return {
                id: event.id,
                type: "create",
                title: `Created ${event.payload.ref_type || "repository"}${event.payload.ref ? ` "${event.payload.ref}"` : ""}`,
                repoName,
                repoUrl,
                date: event.created_at,
            };
        case "ReleaseEvent":
            return {
                id: event.id,
                type: "release",
                title: `Released ${event.payload.action || "version"}`,
                repoName,
                repoUrl,
                date: event.created_at,
            };
        case "PullRequestEvent":
            return {
                id: event.id,
                type: "pr",
                title: `${event.payload.action || "Opened"} pull request`,
                repoName,
                repoUrl,
                date: event.created_at,
            };
        case "WatchEvent":
            return {
                id: event.id,
                type: "star",
                title: "Starred repository",
                repoName,
                repoUrl,
                date: event.created_at,
            };
        case "ForkEvent":
            return {
                id: event.id,
                type: "fork",
                title: "Forked repository",
                repoName,
                repoUrl,
                date: event.created_at,
            };
        default:
            return null;
    }
}

// Merge commits and events into unified activity list
function mergeActivity(commits: GitHubCommit[], events: GitHubEvent[], limit = 10): ActivityItem[] {
    const activityItems: ActivityItem[] = [];

    // Add commits as activity items
    commits.forEach(commit => {
        activityItems.push({
            id: commit.sha,
            type: "commit",
            title: commit.message.split("\n")[0],
            repoName: commit.repoName,
            repoUrl: commit.repoUrl,
            date: commit.date,
        });
    });

    // Add non-push events (push events are already covered by commits)
    events
        .filter(e => e.type !== "PushEvent")
        .forEach(event => {
            const item = eventToActivityItem(event);
            if (item) activityItems.push(item);
        });

    // Sort by date and return top items
    return activityItems
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit);
}

// Shared data fetching function - uses DB if available, falls back to GitHub
export async function getGitHubData(): Promise<PortfolioData> {
    try {
        // Get ALL repos from database (for commits)
        const allDbRepos = await prisma.repo.findMany({
            orderBy: [
                { featured: "desc" },
                { order: "asc" },
                { stars: "desc" },
            ],
        });

        // If database has repos, use them
        if (allDbRepos.length > 0) {
            const allRepos = allDbRepos.map(dbRepoToGitHubFormat);

            // Filter to non-hidden repos for display
            const visibleRepos = allDbRepos
                .filter(r => !r.hidden)
                .map(dbRepoToGitHubFormat);

            const featuredRepos = visibleRepos.slice(0, 6);
            const totalStars = visibleRepos.reduce((sum: number, repo) => sum + repo.stargazers_count, 0);

            // Fetch cached commits from database (30 for Show More feature)
            const dbCommits = await prisma.commit.findMany({
                orderBy: { date: "desc" },
                take: 30,
            });

            // Convert DB commits to GitHubCommit format
            const recentCommits: GitHubCommit[] = dbCommits.map(c => ({
                sha: c.sha,
                message: c.message,
                date: c.date.toISOString(),
                repoName: c.repoName,
                repoUrl: c.repoUrl,
                author: c.author,
            }));

            // Fetch user and activity from GitHub (these are lightweight)
            const [user, activity] = await Promise.all([
                getUser(GITHUB_USERNAME),
                getActivity(GITHUB_USERNAME),
            ]);

            // Merge commits and events into unified activity (30 for Show More feature)
            const recentActivity = mergeActivity(recentCommits, activity, 30);

            // Get total commits count from database
            const totalCommits = await prisma.commit.count();

            return {
                user,
                repos: visibleRepos,
                featuredRepos,
                activity,
                recentCommits,
                recentActivity,
                totalStars,
                totalCommits,
                error: null,
            };
        }

        // Fallback: Database empty, fetch from GitHub directly
        const { getRepos, getRecentCommits } = await import("@/lib/github");
        const [user, repos, activity] = await Promise.all([
            getUser(GITHUB_USERNAME),
            getRepos(GITHUB_USERNAME),
            getActivity(GITHUB_USERNAME),
        ]);

        // Fetch recent commits from the repos (only when DB is empty)
        const recentCommits = await getRecentCommits(repos, 10);
        const recentActivity = mergeActivity(recentCommits, activity, 10);

        const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
        const featuredRepos = [...repos]
            .sort((a, b) => b.stargazers_count - a.stargazers_count)
            .slice(0, 6);

        return {
            user,
            repos,
            featuredRepos,
            activity,
            recentCommits,
            recentActivity,
            totalStars,
            totalCommits: recentCommits.length,
            error: null,
        };
    } catch (error) {
        console.error("Failed to fetch data:", error);
        return {
            user: null,
            repos: [],
            featuredRepos: [],
            activity: [],
            recentCommits: [],
            recentActivity: [],
            totalStars: 0,
            totalCommits: 0,
            error: "Failed to load data",
        };
    }
}
