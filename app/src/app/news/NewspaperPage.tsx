/**
 * Newspaper Mode - Editorial/Print-inspired Design
 * Masthead, activity ticker, two-column layout, data tables
 */

"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import type { ModeProps } from "@/types";
import { PERSONAL, SKILLS } from "@/config/site";
import { ContactLinks } from "@/components/ContactLinks";
import { useTheme } from "@/components/ThemeProvider";
import { useAdmin } from "@/components/AdminContext";
import { Sun, Moon, ArrowLeft, GitCommit, Star, GitBranch, GitPullRequest, Rocket, ChevronDown, Loader2, RefreshCw, Calendar, Check, Folder, FolderOpen, ChevronRight, Rss } from "lucide-react";
import "./newspaper.css";

// Types for AI-generated content
interface NewspaperEdition {
    id: string;
    date: string;
    headline: string;
    subheadline: string;
    bodyContent: string[];
    pullQuote: string;
    isFallback: boolean;
    generatedBy: string | null;
}

interface EditionSummary {
    id: string;
    date: string;
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
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

    // State for show more projects
    const [showMoreProjects, setShowMoreProjects] = useState(false);

    // Ref for archive dropdown click-outside detection
    const archiveRef = useRef<HTMLDivElement>(null);

    // Close archive dropdown when clicking outside (U-002)
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (archiveRef.current && !archiveRef.current.contains(event.target as Node)) {
                setShowArchive(false);
            }
        }
        if (showArchive) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showArchive]);

    // Toggle folder expansion
    const toggleFolder = (dateKey: string) => {
        setExpandedFolders(prev => {
            const next = new Set(prev);
            if (next.has(dateKey)) {
                next.delete(dateKey);
            } else {
                next.add(dateKey);
            }
            return next;
        });
    };

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
            const res = await fetch("/api/newspaper/generate", { method: "POST" });
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
        return <div className="newspaper-mode min-h-screen flex items-center justify-center text-red-600">{error}</div>;
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
        <div className="newspaper-mode">
            {/* Fixed Back Button - Top Left (shifts down for admin navbar) */}
            <Link href="/" className={`np-back-btn ${isAdmin ? "np-back-btn-admin" : ""}`}>
                <ArrowLeft className="w-4 h-4" />
                Back to Main
            </Link>

            <div className="newspaper-container">
                {/* Masthead */}
                <header className="np-masthead">
                    <p className="np-masthead-date">{dateStr} • Online Edition</p>
                    <h1>TREMORS</h1>
                    <p className="np-masthead-tagline">"All the Code That's Fit to Ship"</p>
                    <div className="np-masthead-controls">
                        {/* Archive dropdown */}
                        <div className="np-archive-wrapper" ref={archiveRef}>
                            <button onClick={() => setShowArchive(!showArchive)} className="np-control-btn">
                                <Calendar className="w-4 h-4" />
                                Archive
                            </button>
                            {showArchive && editions.length > 0 && (() => {
                                // Separate fallbacks and non-fallbacks
                                const regularEditions = editions.filter(e => !e.isFallback);
                                const fallbackEditions = editions.filter(e => e.isFallback);

                                // Group regular editions by date
                                const grouped = regularEditions.reduce((acc, e) => {
                                    const dateKey = new Date(e.date).toLocaleDateString();
                                    if (!acc[dateKey]) acc[dateKey] = [];
                                    acc[dateKey].push(e);
                                    return acc;
                                }, {} as Record<string, typeof editions>);

                                // Check if any edition in a date group is active
                                const hasActiveEdition = (editionList: typeof editions) =>
                                    editionList.some(e => e.isActive);

                                return (
                                    <div className="np-archive-dropdown">
                                        {/* Regular date folders */}
                                        {Object.entries(grouped).map(([dateKey, dateEditions]) => {
                                            const isExpanded = expandedFolders.has(dateKey);
                                            const hasActive = hasActiveEdition(dateEditions);
                                            return (
                                                <div key={dateKey} className="np-folder">
                                                    <button
                                                        className={`np-folder-header ${hasActive && isAdmin ? "np-folder-active" : ""}`}
                                                        onClick={() => toggleFolder(dateKey)}
                                                    >
                                                        {isExpanded ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
                                                        <span>{dateKey}</span>
                                                        <ChevronRight className={`w-3 h-3 np-folder-chevron ${isExpanded ? "np-folder-chevron-open" : ""}`} />
                                                    </button>
                                                    {isExpanded && (
                                                        <div className="np-folder-contents">
                                                            {dateEditions.map((e, idx) => (
                                                                <div
                                                                    key={e.id}
                                                                    className={`np-variant ${e.isActive && isAdmin ? "np-variant-active" : ""}`}
                                                                >
                                                                    <button
                                                                        onClick={() => loadEdition(e.id)}
                                                                        className="np-variant-name"
                                                                    >
                                                                        v{dateEditions.length - idx}
                                                                    </button>
                                                                    {isAdmin && (
                                                                        <button
                                                                            onClick={() => setActiveEdition(e.id)}
                                                                            className={`np-variant-use ${e.isActive ? "np-variant-use-active" : ""}`}
                                                                            title="Set as active"
                                                                        >
                                                                            {e.isActive ? <Check className="w-3 h-3" /> : "Use"}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        {/* Fallback folder - admin only */}
                                        {isAdmin && fallbackEditions.length > 0 && (
                                            <div className="np-folder np-folder-fallback">
                                                <button
                                                    className="np-folder-header np-folder-header-fallback"
                                                    onClick={() => toggleFolder("fallback")}
                                                >
                                                    {expandedFolders.has("fallback") ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
                                                    <span>Fallbacks</span>
                                                    <ChevronRight className={`w-3 h-3 np-folder-chevron ${expandedFolders.has("fallback") ? "np-folder-chevron-open" : ""}`} />
                                                </button>
                                                {expandedFolders.has("fallback") && (
                                                    <div className="np-folder-contents">
                                                        {fallbackEditions.map((e, idx) => (
                                                            <div
                                                                key={e.id}
                                                                className={`np-variant np-variant-fallback ${e.isActive ? "np-variant-active" : ""}`}
                                                            >
                                                                <button
                                                                    onClick={() => loadEdition(e.id)}
                                                                    className="np-variant-name"
                                                                >
                                                                    v{fallbackEditions.length - idx}
                                                                </button>
                                                                <button
                                                                    onClick={() => setActiveEdition(e.id)}
                                                                    className={`np-variant-use ${e.isActive ? "np-variant-use-active" : ""}`}
                                                                    title="Set as active"
                                                                >
                                                                    {e.isActive ? <Check className="w-3 h-3" /> : "Use"}
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                        {/* Admin regenerate button */}
                        {isAdmin && (
                            <button
                                onClick={regenerateContent}
                                disabled={isRegenerating}
                                className="np-control-btn"
                            >
                                <RefreshCw className={`w-4 h-4 ${isRegenerating ? "animate-spin" : ""}`} />
                                {isRegenerating ? "Generating..." : "Regenerate"}
                            </button>
                        )}
                        <a href="/api/news/rss" target="_blank" rel="noopener noreferrer" className="np-control-btn">
                            <Rss className="w-4 h-4" />
                            RSS
                        </a>
                        <button onClick={toggleTheme} className="np-control-btn">
                            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            {theme === "dark" ? "Light Edition" : "Dark Edition"}
                        </button>
                    </div>
                </header>

                {/* Activity Ticker */}
                {data.recentActivity.length > 0 && (
                    <div className="np-ticker">
                        <div className="np-ticker-content">
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
                                    <span key={i} className="np-ticker-item">
                                        <Icon className="w-3 h-3 inline" />{" "}
                                        <span className="np-ticker-highlight">{item.repoName}</span>: {item.title}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Main Headline - AI Generated */}
                <h2 className="np-headline">
                    {isLoadingContent ? (
                        <span className="inline-block w-3/4 h-10 bg-current opacity-10 animate-pulse rounded" />
                    ) : (
                        edition?.headline || "Local Developer Builds AI-Powered Platforms, Refuses to Stop Pushing Commits"
                    )}
                </h2>
                <p className="np-subheadline">
                    {isLoadingContent ? (
                        <span className="inline-block w-2/3 h-6 bg-current opacity-10 animate-pulse rounded" />
                    ) : (
                        edition?.subheadline || `${PERSONAL.name}, known online as "${PERSONAL.handle}," continues his relentless pursuit of cleaner code and smarter applications`
                    )}
                </p>

                <div className="np-byline">
                    <span>
                        <span className="np-byline-author">{PERSONAL.name.toUpperCase()}</span> • {PERSONAL.tagline}
                    </span>
                    <span>📍 {PERSONAL.location || "India"}</span>
                </div>

                {/* Main Content - AI Generated */}
                <div className="np-columns">
                    {edition?.bodyContent ? (
                        <>
                            {edition.bodyContent.map((para, i) => (
                                <p key={i}>{para}</p>
                            ))}
                            <div className="np-pull-quote">
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
                <div className="np-stats-block">
                    <div className="np-stat">
                        <div className="np-stat-number">{user?.public_repos || repos.length}</div>
                        <div className="np-stat-label">Public Repos</div>
                    </div>
                    <div className="np-stat">
                        <div className="np-stat-number">
                            {isLoadingCommits ? (
                                <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                            ) : (
                                totalCommits ?? "—"
                            )}
                        </div>
                        <div className="np-stat-label">Total Commits</div>
                    </div>
                </div>

                {/* Projects as Data Table */}
                <table className="np-data-table">
                    <caption>Featured Projects</caption>
                    <thead>
                        <tr>
                            <th>Project</th>
                            <th>Language</th>
                            <th>Topics</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayRepos.map((repo) => (
                            <tr key={repo.id}>
                                <td>
                                    <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
                                        {repo.name}
                                    </a>
                                </td>
                                <td>{repo.language || "—"}</td>
                                <td>{repo.topics?.slice(0, 3).join(", ") || "—"}</td>
                                <td>
                                    {repo.homepage ? (
                                        <a href={repo.homepage} target="_blank" rel="noopener noreferrer">Live</a>
                                    ) : "Source"}
                                </td>
                            </tr>
                        ))}
                        {showMoreProjects && otherRepos.slice(0, 10).map((repo) => (
                            <tr key={repo.id} className="np-more-project">
                                <td>
                                    <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
                                        {repo.name}
                                    </a>
                                </td>
                                <td>{repo.language || "—"}</td>
                                <td>{repo.topics?.slice(0, 3).join(", ") || "—"}</td>
                                <td>
                                    {repo.homepage ? (
                                        <a href={repo.homepage} target="_blank" rel="noopener noreferrer">Live</a>
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
                        className="np-control-btn np-show-more"
                    >
                        <ChevronDown className={`w-4 h-4 transition-transform ${showMoreProjects ? "rotate-180" : ""}`} />
                        {showMoreProjects ? "Show Less" : `Show ${Math.min(10, otherRepos.length)} More Projects`}
                    </button>
                )}

                {/* Skills */}
                <h3 className="np-section-header">Technical Proficiencies</h3>
                <div className="np-skills-grouped">
                    {SKILLS.map((category) => (
                        <div key={category.id} className="np-skill-row">
                            <span className="np-skill-category">{category.label}:</span>
                            <span className="np-skill-items">{category.skills.join(" • ")}</span>
                        </div>
                    ))}
                </div>

                {/* Contact */}
                <div className="np-contact-block">
                    <h2>Correspondence</h2>
                    <p>For inquiries regarding positions, collaborations, or just to say hello:</p>
                    <ContactLinks variant="icons-only" className="np-contact-links" />
                </div>

                {/* Footer */}
                <footer className="np-footer">
                    <p>© {new Date().getFullYear()} The Tremors Chronicle. All Rights Reserved.</p>
                </footer>
            </div>
        </div>
    );
}
