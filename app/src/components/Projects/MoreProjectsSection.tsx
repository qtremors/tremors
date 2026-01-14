/**
 * MoreProjectsSection - Secondary projects list/grid
 */

"use client";

import { ChevronDown } from "lucide-react";
import { ProjectCard, RepoWithStatus } from "@/components/ProjectCard";

interface MoreProjectsSectionProps {
    otherRepos: RepoWithStatus[];
    visibleOtherCount: number;
    showMoreProjects: boolean;
    viewMode: "grid" | "list";
    editMode: boolean;
    isAdmin: boolean;
    draggedId: number | null;
    dragOverId: number | null;
    showImages: boolean;
    onShowMore: () => void;
    handlers: {
        handleDragStart: (e: React.DragEvent, id: number) => void;
        handleDragOver: (e: React.DragEvent, id: number) => void;
        handleDragLeave: () => void;
        handleDrop: (e: React.DragEvent, targetId: number) => void;
        handleDragEnd: () => void;
        toggleFeatured: (e: React.MouseEvent, id: number, featured: boolean) => void;
        toggleVisibility: (e: React.MouseEvent, id: number, hidden: boolean) => void;
        handleEdit: (e: React.MouseEvent, repo: RepoWithStatus) => void;
    };
}

export function MoreProjectsSection({
    otherRepos,
    visibleOtherCount,
    showMoreProjects,
    viewMode,
    editMode,
    isAdmin,
    draggedId,
    dragOverId,
    showImages,
    onShowMore,
    handlers,
}: MoreProjectsSectionProps) {
    if (otherRepos.length === 0) return null;

    const displayedRepos = showMoreProjects ? otherRepos : otherRepos.slice(0, visibleOtherCount);

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold border-b border-[var(--border)] pb-2">More Projects</h3>
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-4"}>
                {displayedRepos.map((repo) => (
                    <ProjectCard
                        key={repo.id}
                        repo={repo}
                        size={viewMode === "grid" ? "small" : "list"}
                        editMode={editMode}
                        isAdmin={isAdmin}
                        isDragged={draggedId === repo.id}
                        isDragOver={dragOverId === repo.id}
                        onDragStart={handlers.handleDragStart}
                        onDragOver={handlers.handleDragOver}
                        onDragLeave={handlers.handleDragLeave}
                        onDrop={handlers.handleDrop}
                        onDragEnd={handlers.handleDragEnd}
                        onToggleFeatured={handlers.toggleFeatured}
                        onToggleVisibility={handlers.toggleVisibility}
                        onEdit={handlers.handleEdit}
                        showImages={showImages}
                    />
                ))}
            </div>

            {otherRepos.length > visibleOtherCount && !showMoreProjects && (
                <div className="flex justify-center pt-4">
                    <button
                        onClick={onShowMore}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--accent-cyan)]/50 transition-all group"
                    >
                        <span>Show More Projects</span>
                        <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                    </button>
                </div>
            )}
        </div>
    );
}
