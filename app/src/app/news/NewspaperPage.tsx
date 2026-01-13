/**
 * Newspaper Mode - Editorial/Print-inspired Design
 * Masthead, activity ticker, two-column layout, data tables
 */

"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import type { ModeProps } from "@/types";
import { PERSONAL, SKILLS, NEWS_AGENT } from "@/config/site";
import { ContactLinks } from "@/components/ContactLinks";
import { useTheme } from "@/components/ThemeProvider";
import { useAdmin } from "@/components/AdminContext";
import { Sun, Moon, GitCommit, Star, GitBranch, GitPullRequest, Rocket, ChevronDown, Loader2, RefreshCw, Calendar, Rss, Settings2 } from "lucide-react";
import { NewspaperArchiveModal } from "./components/NewspaperArchiveModal";
import { PersonalitySettingsModal } from "./components/PersonalitySettingsModal";
// newspaper.css migrated to tailwind

/**
 * Format project title - converts kebab-case to Title Case
 * "my-cool-project" -> "My Cool Project"
 */
function formatProjectTitle(name: string): string {
    return name
        .split(/[-_]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
}

// Types for AI-generated content
interface NewspaperEdition {
    id: string;
    date: string;
    headline: string;
    subheadline: string;
    bodyContent: string[];
    pullQuote: string;
    location: string;
    isFallback: boolean;
    generatedBy: string | null;
    agentName?: string;
    personality?: string;
}

interface EditionSummary {
    id: string;
    date: string;
    createdAt: string;
    headline: string;
    isActive: boolean;
    isFallback: boolean;
}

export function NewspaperPage({ data }: ModeProps) {
    const { repos, activity, user, error } = data;
    const { theme, toggleTheme } = useTheme();
    const { isAdmin } = useAdmin();

    // State for live commit count
    const [totalCommits, setTotalCommits] = useState<number | null>(null);
    const [isLoadingCommits, setIsLoadingCommits] = useState(true);

    // State for AI-generated content
    const [edition, setEdition] = useState<NewspaperEdition | null>(null);
    const [editions, setEditions] = useState<EditionSummary[]>([]);
    const [isLoadingContent, setIsLoadingContent] = useState(true);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [showArchive, setShowArchive] = useState(false);

    // AI Personality State
    const [showSettings, setShowSettings] = useState(false);
    const [selectedPersonality, setSelectedPersonality] = useState("tabloid");

    // State for show more projects
    const [showMoreProjects, setShowMoreProjects] = useState(false);

    // Close archive/settings on escape key
    useEffect(() => {
        function handleEscape(event: KeyboardEvent) {
            if (event.key === "Escape") {
                if (showArchive) setShowArchive(false);
                if (showSettings) setShowSettings(false);
            }
        }
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [showArchive, showSettings]);


    // Fetch total commits from API on mount
    useEffect(() => {
        async function fetchCommits() {
            try {
                const response = await fetch("/api/stats/commits");
                if (response.ok) {
                    const data = await response.json();
                    setTotalCommits(data.totalCommits);
                }
            } catch (err) {
                console.error("Failed to fetch commits:", err);
            } finally {
                setIsLoadingCommits(false);
            }
        }
        fetchCommits();
    }, []);

    // Fetch AI content and editions list
    useEffect(() => {
        async function fetchContent() {
            try {
                const [contentRes, editionsRes] = await Promise.all([
                    fetch("/api/newspaper/generate"),
                    fetch("/api/newspaper/editions"),
                ]);
                if (contentRes.ok) {
                    const data = await contentRes.json();
                    setEdition(data);
                    // Sync local personality state if available
                    if (data.personality) {
                        setSelectedPersonality(data.personality);
                    }
                }
                if (editionsRes.ok) {
                    const data = await editionsRes.json();
                    setEditions(data.editions);
                }
            } catch (err) {
                console.error("Failed to fetch newspaper content:", err);
            } finally {
                setIsLoadingContent(false);
            }
        }
        fetchContent();
    }, []);

    // Load specific edition
    const loadEdition = async (id: string) => {
        try {
            const res = await fetch(`/api/newspaper/generate?id=${id}`);
            if (res.ok) {
                const data = await res.json();
                setEdition(data);
                if (data.personality) setSelectedPersonality(data.personality);
            }
        } catch (err) {
            console.error("Failed to load edition:", err);
        }
        setShowArchive(false);
    };

    // Regenerate content (admin only)
    const regenerateContent = async () => {
        setIsRegenerating(true);
        try {
            const res = await fetch("/api/newspaper/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ personalityId: selectedPersonality })
            });
            if (res.ok) {
                const data = await res.json();
                setEdition(data);
                // Refresh editions list
                const editionsRes = await fetch("/api/newspaper/editions");
                if (editionsRes.ok) {
                    const editionsData = await editionsRes.json();
                    setEditions(editionsData.editions);
                }
            }
        } catch (err) {
            console.error("Failed to regenerate:", err);
        } finally {
            setIsRegenerating(false);
        }
    };

    // Set edition as active (admin only)
    const setActiveEdition = async (id: string) => {
        try {
            const res = await fetch("/api/newspaper/active", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ editionId: id }),
            });
            if (res.ok) {
                // Refresh editions list to show new active state
                const editionsRes = await fetch("/api/newspaper/editions");
                if (editionsRes.ok) {
                    const data = await editionsRes.json();
                    setEditions(data.editions);
                }
                // Reload the active edition
                const contentRes = await fetch("/api/newspaper/generate");
                if (contentRes.ok) {
                    const data = await contentRes.json();
                    setEdition(data);
                }
            }
        } catch (err) {
            console.error("Failed to set active:", err);
        }
        setShowArchive(false);
    };

    if (error) {
        return <div className="font-serif bg-[var(--np-bg)] text-[var(--np-ink)] min-h-screen flex items-center justify-center text-red-600">{error}</div>;
    }

    // Get visible repos (filter hidden ones)
    const visibleRepos = repos.filter(r => !r.hidden);
    const featuredRepos = visibleRepos.filter(r => r.featured).slice(0, 8);
    const displayRepos = featuredRepos.length > 0 ? featuredRepos : visibleRepos.slice(0, 8);
    const otherRepos = visibleRepos.filter(r => !r.featured);

    // Format date
    const today = new Date();
    const dateStr = today.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    // Calculate stats
    const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
    const totalForks = repos.reduce((sum, r) => sum + (r.forks_count || 0), 0);

    return (
        <div className="font-serif bg-[var(--np-bg)] bg-none text-[var(--np-ink)] leading-[1.7] text-[18px] min-h-screen selection:bg-[var(--np-accent)] selection:text-[var(--np-paper)]">
            <div className="max-w-[1100px] mx-auto bg-[var(--np-paper)] min-h-screen px-6 md:px-[60px] py-10 pt-16 md:pt-10">
                {/* Masthead */}
                <header className="text-center border-b-[3px] border-double border-[var(--np-ink)] pb-6 mb-8">
                    <p className="text-[0.75rem] uppercase tracking-[3px] mb-2">{dateStr} • Online Edition</p>
                    <h1 className="font-display text-[clamp(3rem,10vw,6rem)] font-[900] tracking-[-2px] leading-none mb-2">TREMORS</h1>
                    <p className="italic text-[var(--np-ink-light)]">"All the Code That's Fit to Ship"</p>
                    <div className="mt-4 flex justify-center gap-4 flex-wrap">
                        {/* Archive button */}
                        <button onClick={() => setShowArchive(true)} className="inline-flex items-center gap-2 bg-none border border-[var(--np-ink)] px-4 py-2 font-inherit text-[0.85rem] cursor-pointer text-[var(--np-ink)] no-underline transition-all duration-200 hover:bg-[var(--np-ink)] hover:text-[var(--np-paper)]">
                            <Calendar className="w-4 h-4" />
                            Archive
                        </button>
                        {/* Admin regenerate button */}
                        {isAdmin && (
                            <>
                                <button
                                    onClick={regenerateContent}
                                    disabled={isRegenerating}
                                    className="inline-flex items-center gap-2 bg-none border border-[var(--np-ink)] px-4 py-2 font-inherit text-[0.85rem] cursor-pointer text-[var(--np-ink)] no-underline transition-all duration-200 hover:bg-[var(--np-ink)] hover:text-[var(--np-paper)]"
                                >
                                    <RefreshCw className={`w-4 h-4 ${isRegenerating ? "animate-spin" : ""}`} />
                                    {isRegenerating ? "Generating..." : "Regenerate"}
                                </button>
                                <button
                                    onClick={() => setShowSettings(true)}
                                    className="inline-flex items-center gap-2 bg-none border border-[var(--np-ink)] px-4 py-2 font-inherit text-[0.85rem] cursor-pointer text-[var(--np-ink)] no-underline transition-all duration-200 hover:bg-[var(--np-ink)] hover:text-[var(--np-paper)]"
                                >
                                    <Settings2 className="w-4 h-4" />
                                    {NEWS_AGENT.personalities.find(p => p.id === selectedPersonality)?.name || "Skye"}
                                </button>
                            </>
                        )}
                        <a href="/api/news/rss" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-none border border-[var(--np-ink)] px-4 py-2 font-inherit text-[0.85rem] cursor-pointer text-[var(--np-ink)] no-underline transition-all duration-200 hover:bg-[var(--np-ink)] hover:text-[var(--np-paper)]">
                            <Rss className="w-4 h-4" />
                            RSS
                        </a>
                        <button onClick={toggleTheme} className="inline-flex items-center gap-2 bg-none border border-[var(--np-ink)] px-4 py-2 font-inherit text-[0.85rem] cursor-pointer text-[var(--np-ink)] no-underline transition-all duration-200 hover:bg-[var(--np-ink)] hover:text-[var(--np-paper)]">
                            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            {theme === "dark" ? "Light Edition" : "Dark Edition"}
                        </button>
                    </div>
                </header>

                {/* Activity Ticker */}
                {data.recentActivity.length > 0 && (
                    <div className="bg-[var(--np-ink)] text-[var(--np-paper)] py-3 mx-[-24px] md:mx-[-60px] my-8 overflow-hidden font-mono text-[0.8rem]">
                        <div className="flex whitespace-nowrap animate-np-ticker w-max hover:[animation-play-state:paused]">
                            {/* Duplicate for seamless loop - show 10 items */}
                            {[...data.recentActivity.slice(0, 10), ...data.recentActivity.slice(0, 10)].map((item, i) => {
                                const IconMap: Record<string, typeof GitCommit> = {
                                    commit: GitCommit,
                                    star: Star,
                                    create: GitBranch,
                                    pr: GitPullRequest,
                                    release: Rocket,
                                    fork: GitBranch,
                                };
                                const Icon = IconMap[item.type] || GitCommit;
                                return (
                                    <span key={i} className="px-12 shrink-0">
                                        <Icon className="w-3 h-3 inline" />{" "}
                                        <span className="text-[var(--np-accent)]">{item.repoName}</span>: {item.title}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Main Headline - AI Generated */}
                <h2 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[1.1] mt-12 mb-6 border-b-2 border-[var(--np-ink)] pb-3">
                    {isLoadingContent ? (
                        <span className="inline-block w-3/4 h-10 bg-current opacity-10 animate-pulse rounded" />
                    ) : (
                        edition?.headline || "Local Developer Builds AI-Powered Platforms, Refuses to Stop Pushing Commits"
                    )}
                </h2>
                <p className="font-display text-[1.5rem] font-normal italic mb-8 text-[var(--np-ink-light)]">
                    {isLoadingContent ? (
                        <span className="inline-block w-2/3 h-6 bg-current opacity-10 animate-pulse rounded" />
                    ) : (
                        edition?.subheadline || `${PERSONAL.name}, known online as "${PERSONAL.handle}," continues his relentless pursuit of cleaner code and smarter applications`
                    )}
                </p>

                <div className="text-[0.85rem] uppercase tracking-[2px] mb-6 flex justify-between flex-wrap gap-2">
                    <span>
                        <span className="text-[var(--np-accent)] font-semibold">{PERSONAL.name.toUpperCase()}</span> • {PERSONAL.tagline}
                    </span>
                    <span>📍 {edition?.location || "VØID"}</span>
                </div>

                {/* Main Content - AI Generated */}
                <div className="columns-1 md:columns-2 gap-10 [column-rule:1px_solid_var(--np-rule)] [&_p]:mb-[1.5em] [&_p]:text-justify [&_p]:[hyphens:auto] [&_p:first-of-type::first-letter]:font-display [&_p:first-of-type::first-letter]:text-[4rem] [&_p:first-of-type::first-letter]:float-left [&_p:first-of-type::first-letter]:leading-[0.8] [&_p:first-of-type::first-letter]:pr-3 [&_p:first-of-type::first-letter]:text-[var(--np-accent)]">
                    {edition?.bodyContent ? (
                        <>
                            {edition.bodyContent.map((para, i) => (
                                <p key={i}>{para}</p>
                            ))}
                            <div className="[break-inside:avoid] border-l-4 border-[var(--np-accent)] px-6 py-4 my-6 text-[1.3rem] italic font-display">
                                {edition.pullQuote}
                            </div>
                        </>
                    ) : (
                        <>
                            <p>
                                In a world increasingly dominated by AI assistants and automated workflows, one developer has made it his
                                mission to bridge the gap between traditional web engineering and cutting-edge language models. {PERSONAL.name},
                                a Computer Science graduate and self-proclaimed "{PERSONAL.tagline}," has been quietly building an impressive
                                portfolio of projects that span from quiz platforms to music players.
                            </p>
                            <p>
                                "I fell in love with Python," {PERSONAL.name.split(" ")[0]} explains, "and I never looked back. There's an elegance to it that
                                just makes sense." His focus on the Django and FastAPI ecosystems has led to the creation of numerous
                                production-ready applications, each demonstrating a deep understanding of backend architecture and
                                real-time web features.
                            </p>
                            <div className="np-pull-quote">
                                "I believe in writing code that's not just functional, but clean, efficient, and maintainable."
                            </div>
                            <p>
                                Beyond application development, {PERSONAL.name.split(" ")[0]} has demonstrated a penchant for developer tooling—creating CLIs for
                                Git visualization, remote control APIs for system management, and even a custom Terminal UI for his
                                portfolio. "I appreciate the details of how software interacts with the underlying system," he notes.
                            </p>
                            <p>
                                Currently, {PERSONAL.name.split(" ")[0]} is exploring the intersection of traditional web engineering and LLM capabilities, with
                                the goal of creating "smarter applications" that adapt to user needs in real-time.
                                {PERSONAL.availableForWork && " His status: actively seeking new opportunities."}
                            </p>
                        </>
                    )}
                </div>

                {/* Statistics */}
                <div className="flex justify-center gap-[40px] md:gap-[80px] my-10 py-8 border-y-2 border-[var(--np-ink)] flex-wrap md:flex-nowrap">
                    <div className="text-center">
                        <div className="font-display text-[2.5rem] font-bold text-[var(--np-accent)]">{user?.public_repos || repos.length}</div>
                        <div className="text-[0.75rem] uppercase tracking-[2px] text-[var(--np-ink-light)]">Public Repos</div>
                    </div>
                    <div className="text-center">
                        <div className="font-display text-[2.5rem] font-bold text-[var(--np-accent)]">
                            {isLoadingCommits ? (
                                <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                            ) : (
                                totalCommits ?? "—"
                            )}
                        </div>
                        <div className="text-[0.75rem] uppercase tracking-[2px] text-[var(--np-ink-light)]">Total Commits</div>
                    </div>
                </div>

                {/* Projects as Data Table */}
                <table className="w-full border-collapse my-8 text-[0.95rem] block md:table overflow-x-auto md:overflow-x-visible whitespace-nowrap md:whitespace-normal">
                    <caption className="font-display text-[1.25rem] font-bold text-left mb-3 uppercase tracking-[2px]">Featured Projects</caption>
                    <thead>
                        <tr>
                            <th className="p-3 md:p-4 text-left border-b border-[var(--np-rule)] font-semibold uppercase text-[0.75rem] tracking-widest bg-black/5">Project</th>
                            <th className="p-3 md:p-4 text-left border-b border-[var(--np-rule)] font-semibold uppercase text-[0.75rem] tracking-widest bg-black/5">Language</th>
                            <th className="p-3 md:p-4 text-left border-b border-[var(--np-rule)] font-semibold uppercase text-[0.75rem] tracking-widest bg-black/5">Topics</th>
                            <th className="p-3 md:p-4 text-left border-b border-[var(--np-rule)] font-semibold uppercase text-[0.75rem] tracking-widest bg-black/5">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayRepos.map((repo) => (
                            <tr key={repo.id} className="hover:bg-black/2">
                                <td className="p-3 md:p-4 text-left border-b border-[var(--np-rule)]">
                                    <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="text-[var(--np-accent)] no-underline hover:underline">
                                        {formatProjectTitle(repo.name)}
                                    </a>
                                </td>
                                <td className="p-3 md:p-4 text-left border-b border-[var(--np-rule)]">{repo.language || "—"}</td>
                                <td className="p-3 md:p-4 text-left border-b border-[var(--np-rule)]">{repo.topics?.slice(0, 3).join(", ") || "—"}</td>
                                <td className="p-3 md:p-4 text-left border-b border-[var(--np-rule)]">
                                    {repo.homepage ? (
                                        <a href={repo.homepage} target="_blank" rel="noopener noreferrer" className="text-[var(--np-accent)] no-underline hover:underline">Live</a>
                                    ) : "Source"}
                                </td>
                            </tr>
                        ))}
                        {showMoreProjects && otherRepos.slice(0, 10).map((repo) => (
                            <tr key={repo.id} className="hover:bg-black/2">
                                <td className="p-3 md:p-4 text-left border-b border-[var(--np-rule)]">
                                    <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="text-[var(--np-accent)] no-underline hover:underline">
                                        {formatProjectTitle(repo.name)}
                                    </a>
                                </td>
                                <td className="p-3 md:p-4 text-left border-b border-[var(--np-rule)]">{repo.language || "—"}</td>
                                <td className="p-3 md:p-4 text-left border-b border-[var(--np-rule)]">{repo.topics?.slice(0, 3).join(", ") || "—"}</td>
                                <td className="p-3 md:p-4 text-left border-b border-[var(--np-rule)]">
                                    {repo.homepage ? (
                                        <a href={repo.homepage} target="_blank" rel="noopener noreferrer" className="text-[var(--np-accent)] no-underline hover:underline">Live</a>
                                    ) : "Source"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Show More Projects Button */}
                {otherRepos.length > 0 && (
                    <button
                        onClick={() => setShowMoreProjects(!showMoreProjects)}
                        className="inline-flex items-center gap-2 bg-none border border-[var(--np-ink)] px-4 py-2 font-inherit text-[0.85rem] cursor-pointer text-[var(--np-ink)] no-underline transition-all duration-200 hover:bg-[var(--np-ink)] hover:text-[var(--np-paper)] flex mx-auto my-6"
                    >
                        <ChevronDown className={`w-4 h-4 transition-transform ${showMoreProjects ? "rotate-180" : ""}`} />
                        {showMoreProjects ? "Show Less" : `Show ${Math.min(10, otherRepos.length)} More Projects`}
                    </button>
                )}

                {/* Skills */}
                <h3 className="font-display text-[1.25rem] uppercase tracking-[2px] mt-12 border-b border-[var(--np-ink)] pb-2">Technical Proficiencies</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-0 my-6 py-4 bg-[color-mix(in_srgb,var(--np-ink)_3%,transparent)] border border-[var(--np-rule)]">
                    {SKILLS.map((category) => (
                        <div key={category.id} className="px-4 text-center relative border-r border-dotted border-[var(--np-rule)] lg:border-r md:[&:nth-child(3n)]:border-r-0 lg:[&:nth-child(5n)]:border-r-0 [&:nth-child(2n)]:border-r-0 md:[&:nth-child(2n)]:border-r">
                            <h4 className="font-display text-[0.85rem] font-bold uppercase tracking-widest mb-3 pb-2 border-b-2 border-[var(--np-accent)] text-[var(--np-ink)]">{category.label}</h4>
                            <ul className="list-none m-0 p-0">
                                {category.skills.map((skill, idx) => (
                                    <li key={idx} className="py-1.5 text-[0.85rem] text-[var(--np-ink)]">{skill}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Contact */}
                <div className="mt-12 pt-8 border-t-[3px] border-double border-[var(--np-ink)] text-center">
                    <h2 className="font-display text-[1.5rem] mb-4">Correspondence</h2>
                    <p>For inquiries regarding positions, collaborations, or just to say hello:</p>
                    <ContactLinks variant="icons-only" className="flex justify-center gap-6 flex-wrap mt-4" />
                </div>

                {/* Footer */}
                <footer className="mt-12 pt-6 border-t border-[var(--np-rule)] text-center text-[0.8rem] text-[var(--np-ink-light)]">
                    <p>© {new Date().getFullYear()} The Tremors Chronicle. All Rights Reserved.</p>
                </footer>
            </div>

            {/* Archive Modal */}
            <NewspaperArchiveModal
                isOpen={showArchive}
                onClose={() => setShowArchive(false)}
                editions={editions}
                isAdmin={isAdmin}
                currentEditionId={edition?.id}
                onLoadEdition={loadEdition}
                onSetActive={setActiveEdition}
                onResetToActive={async () => {
                    // Reload the active edition from server
                    try {
                        const res = await fetch("/api/newspaper/generate");
                        if (res.ok) {
                            const data = await res.json();
                            setEdition(data);
                        }
                    } catch (err) {
                        console.error("Failed to reset:", err);
                    }
                }}
            />

            {/* Personality Settings Modal */}
            <PersonalitySettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                selectedPersonalityId={selectedPersonality}
                onSelectPersonality={setSelectedPersonality}
            />
        </div>
    );
}
