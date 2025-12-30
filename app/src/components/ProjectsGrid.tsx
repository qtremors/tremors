/**
 * ProjectsGrid - Bento-style grid with spotlight card for first project
 * Admin can drag to reorder and toggle visibility/featured directly
 * Refactored: Uses ProjectCard sub-component for cleaner code
 */

"use client";

import { useState, useEffect } from "react";
import { useAdmin } from "@/components/AdminContext";
import { useToast } from "@/components/ToastProvider";
import { ChevronDown, ImageIcon, ImageOff, LayoutGrid, List } from "lucide-react";
import { ProjectCard, RepoWithStatus } from "@/components/ProjectCard";
import { ProjectEditModal } from "@/components/ProjectEditModal";
import type { GitHubRepo } from "@/types";

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
    const [editingRepo, setEditingRepo] = useState<RepoWithStatus | null>(null);
    const [showImages, setShowImages] = useState<boolean | null>(null);  // null = loading, prevents flash
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");  // DB-persisted view mode

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
                    toast.error("Failed to load project data");
                })
                .finally(() => setLoading(false));
        }
    }, [isAdmin, toast]);

    // Fetch settings (showProjectImages, projectViewMode) on mount
    useEffect(() => {
        fetch("/api/admin/settings")
            .then((res) => res.json())
            .then((data) => {
                if (data.success && data.settings) {
                    setShowImages(data.settings.showProjectImages ?? true);
                    if (data.settings.projectViewMode === "list" || data.settings.projectViewMode === "grid") {
                        setViewMode(data.settings.projectViewMode);
                    }
                }
            })
            .catch(() => {
                // Silently fail - use defaults
            });
    }, []);

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
            toast.error("Failed to save order");
        }
        setDraggedId(null);
    };

    const handleDragEnd = () => {
        setDraggedId(null);
        setDragOverId(null);
    };

    // Edit handler - open modal
    const handleEdit = (e: React.MouseEvent, repo: RepoWithStatus) => {
        e.stopPropagation();
        setEditingRepo(repo);
    };

    // Update repos when modal saves/resets
    const handleEditUpdate = (updatedFields: Partial<RepoWithStatus>) => {
        if (!editingRepo) return;
        setRepos(repos.map(r =>
            r.id === editingRepo.id ? { ...r, ...updatedFields } : r
        ));
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
            {/* Admin Controls: View Toggle + Image Toggle */}
            {editMode && (
                <div className="flex justify-end gap-2">
                    {/* View Mode Toggle */}
                    <div className="flex rounded-xl border border-[var(--border)] overflow-hidden">
                        <button
                            onClick={async () => {
                                if (viewMode === "grid") return;
                                setViewMode("grid");
                                // Persist to DB (will fail silently for non-admin)
                                try {
                                    await fetch("/api/admin/settings", {
                                        method: "PATCH",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ projectViewMode: "grid" }),
                                    });
                                } catch {
                                    // Non-admin or error - view still changes locally
                                }
                            }}
                            className={`flex items-center gap-1.5 px-3 py-2 transition-colors ${viewMode === "grid"
                                ? "bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]"
                                : "text-[var(--text-muted)] hover:text-[var(--text)]"
                                }`}
                            title="Grid view"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={async () => {
                                if (viewMode === "list") return;
                                setViewMode("list");
                                try {
                                    await fetch("/api/admin/settings", {
                                        method: "PATCH",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ projectViewMode: "list" }),
                                    });
                                } catch {
                                    // Non-admin or error - view still changes locally
                                }
                            }}
                            className={`flex items-center gap-1.5 px-3 py-2 transition-colors ${viewMode === "list"
                                ? "bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]"
                                : "text-[var(--text-muted)] hover:text-[var(--text)]"
                                }`}
                            title="List view"
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Admin: Image Toggle */}
                    {editMode && (
                        <button
                            onClick={async () => {
                                const newValue = !showImages;
                                setShowImages(newValue);
                                try {
                                    await fetch("/api/admin/settings", {
                                        method: "PATCH",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ showProjectImages: newValue }),
                                    });
                                } catch {
                                    setShowImages(!newValue);
                                    toast.error("Failed to save setting");
                                }
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors ${showImages
                                ? "border-[var(--accent-cyan)] text-[var(--accent-cyan)]"
                                : "border-[var(--border)] text-[var(--text-muted)]"
                                }`}
                        >
                            {showImages ? <ImageIcon className="w-4 h-4" /> : <ImageOff className="w-4 h-4" />}
                            {showImages ? "Images On" : "Images Off"}
                        </button>
                    )}
                </div>
            )}

            {/* Featured Projects Section */}
            {spotlightRepos.length > 0 && (
                viewMode === "grid" ? (
                    // Grid: 2+3 Bento Layout with 2:1 aspect ratio
                    <div className="space-y-4">
                        {/* Top row: 2 featured cards with center placeholder */}
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            {/* First featured card - spans 2 columns */}
                            {spotlightRepos[0] && (
                                <div className="md:col-span-2 aspect-[2/1]">
                                    <ProjectCard
                                        repo={spotlightRepos[0]}
                                        size="large"
                                        editMode={editMode}
                                        isAdmin={isAdmin}
                                        isDragged={draggedId === spotlightRepos[0].id}
                                        isDragOver={dragOverId === spotlightRepos[0].id}
                                        onDragStart={handleDragStart}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        onDragEnd={handleDragEnd}
                                        onToggleFeatured={toggleFeatured}
                                        onToggleVisibility={toggleVisibility}
                                        onEdit={handleEdit}
                                        showImages={showImages ?? false}
                                    />
                                </div>
                            )}

                            {/* Center placeholder - Logo + Last Updated Repo */}
                            {spotlightRepos.length >= 2 && (
                                <div className="hidden md:flex md:col-span-1 aspect-[1/1] items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card-bg)]/50">
                                    {(() => {
                                        // Find the most recently pushed repo (use initialRepos for pushed_at data)
                                        const lastUpdated = [...initialRepos]
                                            .filter(r => r.pushed_at)
                                            .sort((a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime())[0];

                                        const timeAgo = lastUpdated?.pushed_at ? (() => {
                                            const diff = Date.now() - new Date(lastUpdated.pushed_at).getTime();
                                            const hours = Math.floor(diff / (1000 * 60 * 60));
                                            const days = Math.floor(hours / 24);
                                            if (days > 0) return `${days}d ago`;
                                            if (hours > 0) return `${hours}h ago`;
                                            return "just now";
                                        })() : null;

                                        return (
                                            <div className="text-center group p-4">
                                                <a
                                                    href="https://github.com/qtremors"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-block mb-4"
                                                >
                                                    <span className="inline-block logo-glow-hover">
                                                        <img
                                                            src="/alien.svg"
                                                            alt="Logo"
                                                            className="w-16 h-16 opacity-70 hover:opacity-100 hover:scale-110 transition-all"
                                                        />
                                                    </span>
                                                </a>
                                                {lastUpdated && (
                                                    <a
                                                        href={lastUpdated.html_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="block hover:text-[var(--accent-cyan)] transition-colors"
                                                    >
                                                        <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-2">Last Active</p>
                                                        <p className="text-sm font-semibold truncate max-w-[140px] mx-auto mb-1">{lastUpdated.name}</p>
                                                        <p className="text-xs text-[var(--accent-cyan)] font-medium">{timeAgo}</p>
                                                    </a>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            {/* Second featured card - spans 2 columns */}
                            {spotlightRepos[1] && (
                                <div className="md:col-span-2 aspect-[2/1]">
                                    <ProjectCard
                                        repo={spotlightRepos[1]}
                                        size="large"
                                        editMode={editMode}
                                        isAdmin={isAdmin}
                                        isDragged={draggedId === spotlightRepos[1].id}
                                        isDragOver={dragOverId === spotlightRepos[1].id}
                                        onDragStart={handleDragStart}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        onDragEnd={handleDragEnd}
                                        onToggleFeatured={toggleFeatured}
                                        onToggleVisibility={toggleVisibility}
                                        onEdit={handleEdit}
                                        showImages={showImages ?? false}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Bottom row: 3 smaller featured cards with 2:1 aspect ratio */}
                        {spotlightRepos.length > 2 && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {spotlightRepos.slice(2, 5).map((repo) => (
                                    <div key={repo.id} className="aspect-[2/1]">
                                        <ProjectCard
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
                                            onEdit={handleEdit}
                                            showImages={showImages ?? false}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    // List: Vertical stack
                    <div className="space-y-3">
                        {spotlightRepos.map((repo) => (
                            <ProjectCard
                                key={repo.id}
                                repo={repo}
                                size="list"
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
                                onEdit={handleEdit}
                                showImages={showImages ?? false}
                            />
                        ))}
                    </div>
                )
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
                    {viewMode === "grid" ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {(editMode ? otherRepos : otherRepos.slice(0, visibleOtherCount)).map((repo) => (
                                <div key={repo.id} className="aspect-[2/1]">
                                    <ProjectCard
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
                                        onEdit={handleEdit}
                                        showImages={showImages ?? false}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {(editMode ? otherRepos : otherRepos.slice(0, visibleOtherCount)).map((repo) => (
                                <ProjectCard
                                    key={repo.id}
                                    repo={repo}
                                    size="list"
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
                                    onEdit={handleEdit}
                                    showImages={showImages ?? false}
                                />
                            ))}
                        </div>
                    )}
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

            {/* Edit Modal */}
            {editingRepo && (
                <ProjectEditModal
                    repo={editingRepo}
                    onClose={() => setEditingRepo(null)}
                    onUpdate={handleEditUpdate}
                />
            )}
        </div>
    );
}
