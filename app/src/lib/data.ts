import { getUser, getActivity } from "@/lib/github";
import { prisma } from "@/lib/db";
import { parseTopics } from "@/lib/utils";
import { eventToActivityItem } from "@/lib/activity";
import type { PortfolioData, GitHubEvent, GitHubCommit, ActivityItem, GitHubRepo } from "@/types";
import { GITHUB_CONFIG, DATA_LIMITS } from "@/config/site";

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
    topics: any; // Mapped from Prisma JsonValue
    pushedAt: Date;
    createdAt: Date;
    customName: string | null;
    customDescription: string | null;
    featured: boolean;
    order: number;
    hidden: boolean;
    imageSource?: string | null;
    customImageUrl?: string | null;
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
        topics: parseTopics(dbRepo.topics),
        pushed_at: dbRepo.pushedAt.toISOString(),
        created_at: dbRepo.createdAt.toISOString(),
        fork: false,
        // Include admin properties for all users
        featured: dbRepo.featured,
        order: dbRepo.order,
        hidden: dbRepo.hidden,
        // Image settings
        imageSource: dbRepo.imageSource as "github" | "custom" | "none" | null | undefined,
        customImageUrl: dbRepo.customImageUrl,
    };
}



// Convert DB activity to ActivityItem format
function dbActivityToActivityItem(dbActivity: {
    id: string;
    type: string;
    title: string;
    repoName: string;
    repoUrl: string;
    date: Date;
}): ActivityItem {
    return {
        id: dbActivity.id,
        type: dbActivity.type as ActivityItem['type'],
        title: dbActivity.title,
        repoName: dbActivity.repoName,
        repoUrl: dbActivity.repoUrl,
        date: dbActivity.date.toISOString(),
    };
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

// Merge commits with cached activity items (from database)
function mergeActivityWithCache(commits: GitHubCommit[], cachedActivity: ActivityItem[], limit = 10): ActivityItem[] {
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

    // Add cached activity items, deduplicating strictly by checking if id already exists in activityItems
    const existingIds = new Set(activityItems.map(item => item.id));
    
    cachedActivity.forEach(item => {
        if (!existingIds.has(item.id)) {
            activityItems.push(item);
        }
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
            where: {
                id: { gte: 0 } // Dummy condition to change the SQL string and bypass Postgres cached plans for the JSONB migration
            },
            orderBy: [
                { featured: "desc" },
                { order: "asc" },
                { stars: "desc" },
            ],
        });

        // If database has repos, use them
        if (allDbRepos.length > 0) {
            // Filter to non-hidden repos for display
            const visibleRepos = allDbRepos
                .filter(r => !r.hidden)
                .map(dbRepoToGitHubFormat);

            const featuredRepos = visibleRepos.slice(0, 6);
            const totalStars = visibleRepos.reduce((sum: number, repo) => sum + repo.stargazers_count, 0);

            // Fetch cached commits from database
            const dbCommits = await prisma.commit.findMany({
                orderBy: { date: "desc" },
                take: DATA_LIMITS.recentCommits,
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

            // Fetch user from GitHub (lightweight call) but cache heavily
            const user = await getUser(GITHUB_CONFIG.username);

            // Try to get cached activity from database
            const dbActivity = await prisma.activity.findMany({
                orderBy: { date: "desc" },
                take: DATA_LIMITS.recentActivity,
            });

            // Convert cached activity or fallback to GitHub
            let activity: GitHubEvent[] = [];
            if (dbActivity.length === 0) {
                // No cached activity, fetch from GitHub
                activity = await getActivity(GITHUB_CONFIG.username);
            }

            // Convert DB activity to ActivityItem format
            const cachedActivityItems = dbActivity.map(dbActivityToActivityItem);

            // Merge commits and events into unified activity (30 for Show More feature)
            // Use cached activity if available, otherwise merge from GitHub events
            const recentActivity = cachedActivityItems.length > 0
                ? mergeActivityWithCache(recentCommits, cachedActivityItems, DATA_LIMITS.recentActivity)
                : mergeActivity(recentCommits, activity, DATA_LIMITS.recentActivity);

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
            getUser(GITHUB_CONFIG.username),
            getRepos(GITHUB_CONFIG.username),
            getActivity(GITHUB_CONFIG.username),
        ]);

        // Fetch recent commits from the repos (only when DB is empty)
        const recentCommits = await getRecentCommits(repos, DATA_LIMITS.recentCommits);
        const recentActivity = mergeActivity(recentCommits, activity, DATA_LIMITS.recentActivity);

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
            // Provide a dummy user instead of null to prevent crash
            user: {
                login: GITHUB_CONFIG.username,
                avatar_url: "",
                html_url: `https://github/${GITHUB_CONFIG.username}`,
                name: GITHUB_CONFIG.username,
                bio: "Loading profile data...",
                public_repos: 0,
                followers: 0,
                following: 0,
            },
            repos: [],
            featuredRepos: [],
            activity: [],
            recentCommits: [],
            recentActivity: [],
            totalStars: 0,
            totalCommits: 0,
            error: "Failed to load data from database",
        };
    }
}
