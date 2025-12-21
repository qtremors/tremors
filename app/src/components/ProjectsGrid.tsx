/**
 * ProjectsGrid - Bento-style grid with spotlight card for first project
 * Admin can drag to reorder and toggle visibility/featured directly
 * Refactored: Uses ProjectCard sub-component for cleaner code
 */

"use client";

import { useState, useEffect } from "react";
import { useAdmin } from "@/components/AdminContext";
import { useToast } from "@/components/ToastProvider";
import { ChevronDown } from "lucide-react";
import { ProjectCard, RepoWithStatus } from "@/components/ProjectCard";
import type { GitHubRepo } from "@/lib/github";

interface ProjectsGridProps {
    repos: GitHubRepo[];
}

export function ProjectsGrid({ repos: initialRepos }: ProjectsGridProps) {
    const { isAdmin, editMode } = useAdmin();
    const toast = useToast();
    const [repos, setRepos] = useState<RepoWithStatus[]>(initialRepos);
    const [loading, setLoading] = useState(false);
    const [draggedId, setDraggedId] = useState<number | null>(null);
    const [dragOverId, setDragOverId] = useState<number | null>(null);
    const [visibleOtherCount, setVisibleOtherCount] = useState(6);

    // Fetch repos with hidden status from API when admin
    useEffect(() => {
        if (isAdmin) {
            setLoading(true);
            fetch("/api/admin/repos")
                .then((res) => res.json())
                .then((data) => {
                    if (data.success && data.repos) {
                        const dbRepos = data.repos.map(
                            (r: {
                                id: number;
                                name: string;
                                fullName: string;
                                description: string | null;
                                htmlUrl: string;
                                homepage: string | null;
                                stars: number;
                                forks: number;
                                language: string | null;
                                topics: string[];
                                hidden: boolean;
                                featured: boolean;
                                order: number;
                            }) => ({
                                id: r.id,
                                name: r.name,
                                full_name: r.fullName,
                                description: r.description,
                                html_url: r.htmlUrl,
                                homepage: r.homepage,
                                stargazers_count: r.stars,
                                forks_count: r.forks,
                                language: r.language,
                                topics: r.topics,
                                hidden: r.hidden,
                                featured: r.featured,
                                order: r.order,
                                pushed_at: "",
                                created_at: "",
                                fork: false,
                            })
                        );
                        setRepos(dbRepos);
                    }
                })
                .catch(() => {
                    // Silently fail - use initial repos
                })
                .finally(() => setLoading(false));
        }
    }, [isAdmin]);

    // Toggle visibility
    const toggleVisibility = async (e: React.MouseEvent, id: number, hidden: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        const repo = repos.find((r) => r.id === id);
        try {
            await fetch("/api/admin/repos", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, hidden: !hidden }),
            });
            setRepos(repos.map((r) => (r.id === id ? { ...r, hidden: !hidden } : r)));
            toast.success(`${repo?.name} ${!hidden ? "hidden" : "visible"}`);
        } catch {
            toast.error("Failed to update visibility");
        }
    };

    // Toggle featured
    const toggleFeatured = async (e: React.MouseEvent, id: number, featured: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        const repo = repos.find((r) => r.id === id);
        try {
            await fetch("/api/admin/repos", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, featured: !featured }),
            });
            setRepos(repos.map((r) => (r.id === id ? { ...r, featured: !featured } : r)));
            toast.success(`${repo?.name} ${!featured ? "featured" : "unfeatured"}`);
        } catch {
            toast.error("Failed to update featured status");
        }
    };

    // Drag handlers
    const handleDragStart = (e: React.DragEvent, id: number) => {
        setDraggedId(id);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent, id: number) => {
        e.preventDefault();
        if (draggedId !== id) setDragOverId(id);
    };

    const handleDragLeave = () => setDragOverId(null);

    const handleDrop = async (e: React.DragEvent, targetId: number) => {
        e.preventDefault();
        setDragOverId(null);
        if (draggedId === null || draggedId === targetId) return;

        const draggedIndex = repos.findIndex((r) => r.id === draggedId);
        const targetIndex = repos.findIndex((r) => r.id === targetId);

        const newRepos = [...repos];
        const [draggedItem] = newRepos.splice(draggedIndex, 1);
        newRepos.splice(targetIndex, 0, draggedItem);

        const updatedRepos = newRepos.map((r, i) => ({ ...r, order: i }));
        setRepos(updatedRepos);

        try {
            await Promise.all(
                updatedRepos.map((r, i) =>
                    fetch("/api/admin/repos", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: r.id, order: i }),
                    })
                )
            );
        } catch {
            // Order save failed silently
        }
        setDraggedId(null);
    };

    const handleDragEnd = () => {
        setDraggedId(null);
        setDragOverId(null);
    };

    if (loading) {
        return (
            <div className="grid md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] animate-pulse h-48"
                    />
                ))}
            </div>
        );
    }

    // Filter hidden for non-admin
    const displayRepos = editMode ? repos : repos.filter((r) => !r.hidden);

    // Separate featured and regular repos
    const featuredRepos = displayRepos.filter((r) => r.featured).slice(0, 5);
    const regularRepos = displayRepos.filter((r) => !r.featured);

    const spotlightRepos = featuredRepos.length > 0
        ? featuredRepos
        : displayRepos.slice(0, Math.min(3, displayRepos.length));
    const otherRepos = featuredRepos.length > 0
        ? regularRepos
        : displayRepos.slice(Math.min(3, displayRepos.length));

    if (displayRepos.length === 0) {
        return <p className="text-[var(--text-muted)]">No projects to display</p>;
    }

    return (
        <div className="space-y-8">
            {/* Featured Projects Section - 2+3 Bento Layout */}
            {spotlightRepos.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Top Row - 2 Large Cards */}
                    {spotlightRepos.slice(0, 2).map((repo) => (
                        <ProjectCard
                            key={repo.id}
                            repo={repo}
                            size="large"
                            editMode={editMode}
                            isAdmin={isAdmin}
                            isDragged={draggedId === repo.id}
                            isDragOver={dragOverId === repo.id}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onDragEnd={handleDragEnd}
                            onToggleFeatured={toggleFeatured}
                            onToggleVisibility={toggleVisibility}
                        />
                    ))}

                    {/* Bottom Row - 3 Smaller Cards */}
                    {spotlightRepos.length > 2 && (
                        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {spotlightRepos.slice(2, 5).map((repo) => (
                                <ProjectCard
                                    key={repo.id}
                                    repo={repo}
                                    size="medium"
                                    editMode={editMode}
                                    isAdmin={isAdmin}
                                    isDragged={draggedId === repo.id}
                                    isDragOver={dragOverId === repo.id}
                                    onDragStart={handleDragStart}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onDragEnd={handleDragEnd}
                                    onToggleFeatured={toggleFeatured}
                                    onToggleVisibility={toggleVisibility}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Other Projects Section */}
            {otherRepos.length > 0 && (
                <>
                    <div className="flex items-center gap-4">
                        <h3 className="text-xl font-semibold text-[var(--text-muted)]">More Projects</h3>
                        <span className="flex-1 h-px bg-[var(--border)]" />
                        {!editMode && otherRepos.length > 6 && (
                            <span className="text-sm text-[var(--text-muted)]">
                                {Math.min(visibleOtherCount, otherRepos.length)} of {otherRepos.length}
                            </span>
                        )}
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(editMode ? otherRepos : otherRepos.slice(0, visibleOtherCount)).map((repo) => (
                            <ProjectCard
                                key={repo.id}
                                repo={repo}
                                size="small"
                                editMode={editMode}
                                isAdmin={isAdmin}
                                isDragged={draggedId === repo.id}
                                isDragOver={dragOverId === repo.id}
                                onDragStart={handleDragStart}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onDragEnd={handleDragEnd}
                                onToggleFeatured={toggleFeatured}
                                onToggleVisibility={toggleVisibility}
                            />
                        ))}
                    </div>
                    {/* Show More/Less Buttons */}
                    {!editMode && otherRepos.length > 6 && (
                        <div className="mt-6 flex justify-center gap-3">
                            {visibleOtherCount > 6 && (
                                <button
                                    onClick={() => setVisibleOtherCount(prev => Math.max(prev - 6, 6))}
                                    className="group flex items-center gap-2 px-6 py-3 rounded-full border border-[var(--border)] hover:border-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/5 transition-all"
                                >
                                    <ChevronDown className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent-cyan)] rotate-180" />
                                    <span className="text-[var(--text-muted)] group-hover:text-[var(--text)]">Show Less</span>
                                </button>
                            )}
                            {visibleOtherCount < otherRepos.length && (
                                <button
                                    onClick={() => setVisibleOtherCount(prev => Math.min(prev + 6, otherRepos.length))}
                                    className="group flex items-center gap-2 px-6 py-3 rounded-full border border-[var(--border)] hover:border-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/5 transition-all"
                                >
                                    <span className="text-[var(--text-muted)] group-hover:text-[var(--text)]">Show More</span>
                                    <span className="text-xs text-[var(--accent-cyan)]">+{Math.min(6, otherRepos.length - visibleOtherCount)}</span>
                                    <ChevronDown className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent-cyan)]" />
                                </button>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
