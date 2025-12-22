/**
 * Project Grid Sub-components
 * Reusable card components extracted from ProjectsGrid
 */

"use client";

import { Star, EyeOff, Eye, StarOff, GripVertical, ExternalLink } from "lucide-react";
import { LANGUAGE_COLORS } from "@/lib/github";
import type { GitHubRepo } from "@/types";

export interface RepoWithStatus extends GitHubRepo {
    hidden?: boolean;
    featured?: boolean;
    order?: number;
}

interface AdminControlsProps {
    repo: RepoWithStatus;
    onToggleFeatured: (e: React.MouseEvent, id: number, featured: boolean) => void;
    onToggleVisibility: (e: React.MouseEvent, id: number, hidden: boolean) => void;
}

export function AdminControls({ repo, onToggleFeatured, onToggleVisibility }: AdminControlsProps) {
    return (
        <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
            <div className="p-1.5 rounded-lg bg-[var(--bg)]/80 text-[var(--text-muted)]">
                <GripVertical className="w-4 h-4" />
            </div>
            <button
                onClick={(e) => onToggleFeatured(e, repo.id, repo.featured || false)}
                className={`p-1.5 rounded-lg transition-colors ${repo.featured
                    ? "bg-amber-500/20 text-amber-400"
                    : "bg-[var(--bg)]/80 text-[var(--text-muted)] hover:text-amber-400"
                    }`}
                title={repo.featured ? "Unfeature" : "Feature"}
            >
                {repo.featured ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
            </button>
            <button
                onClick={(e) => onToggleVisibility(e, repo.id, repo.hidden || false)}
                className={`p-1.5 rounded-lg transition-colors ${repo.hidden ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
                    }`}
                title={repo.hidden ? "Show" : "Hide"}
            >
                {repo.hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
        </div>
    );
}

interface ProjectCardProps {
    repo: RepoWithStatus;
    size: "large" | "medium" | "small";
    editMode: boolean;
    isAdmin: boolean;
    isDragged: boolean;
    isDragOver: boolean;
    onDragStart?: (e: React.DragEvent, id: number) => void;
    onDragOver?: (e: React.DragEvent, id: number) => void;
    onDragLeave?: () => void;
    onDrop?: (e: React.DragEvent, id: number) => void;
    onDragEnd?: () => void;
    onToggleFeatured: (e: React.MouseEvent, id: number, featured: boolean) => void;
    onToggleVisibility: (e: React.MouseEvent, id: number, hidden: boolean) => void;
}

export function ProjectCard({
    repo,
    size,
    editMode,
    isAdmin,
    isDragged,
    isDragOver,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    onDragEnd,
    onToggleFeatured,
    onToggleVisibility,
}: ProjectCardProps) {
    const padding = size === "large" ? "p-6" : size === "medium" ? "p-5" : "p-5";
    const titleSize = size === "large" ? "text-xl" : size === "medium" ? "text-lg" : "text-lg";
    const languageSize = size === "large" ? "text-sm" : "text-xs";

    // U-004: Enhanced drag-drop visual feedback
    const cardClasses = `group relative overflow-hidden rounded-2xl border transition-all hover:-translate-y-1 ${isDragged
        ? "opacity-50 border-[var(--accent-cyan)] scale-[0.97] rotate-1 shadow-lg"
        : isDragOver
            ? "border-[var(--accent-cyan)] bg-[var(--accent-cyan)]/10 scale-[1.02] shadow-xl shadow-cyan-500/20 ring-2 ring-[var(--accent-cyan)]/30"
            : repo.hidden
                ? "border-red-500/30 opacity-40 grayscale"
                : "border-[var(--border)] hover:border-[var(--accent-cyan)]/50"
        } ${editMode ? "cursor-grab active:cursor-grabbing" : ""} ${size === "small" ? "bg-[var(--bg-secondary)]" : ""}`;

    return (
        <div
            draggable={isAdmin && editMode}
            onDragStart={editMode ? (e) => onDragStart?.(e, repo.id) : undefined}
            onDragOver={editMode ? (e) => onDragOver?.(e, repo.id) : undefined}
            onDragLeave={editMode ? onDragLeave : undefined}
            onDrop={editMode ? (e) => onDrop?.(e, repo.id) : undefined}
            onDragEnd={editMode ? onDragEnd : undefined}
            className={cardClasses}
        >
            {editMode && (
                <AdminControls
                    repo={repo}
                    onToggleFeatured={onToggleFeatured}
                    onToggleVisibility={onToggleVisibility}
                />
            )}
            <div className={`relative ${padding} ${editMode && size === "small" ? "mt-8" : ""}`}>
                {/* Top row: Language + Live link */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        {repo.language && (
                            <>
                                <span
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: LANGUAGE_COLORS[repo.language] || "#888" }}
                                />
                                <span className={`${languageSize} text-[var(--text-muted)]`}>{repo.language}</span>
                            </>
                        )}
                    </div>
                    {!editMode && repo.homepage && (
                        <a
                            href={repo.homepage}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-1 ${languageSize} text-[var(--text-muted)] hover:text-[var(--accent-cyan)] transition-colors`}
                        >
                            <ExternalLink className={size === "large" ? "w-4 h-4" : "w-3 h-3"} />
                            Website
                        </a>
                    )}
                </div>

                {/* Title links to GitHub */}
                <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => editMode && e.preventDefault()}
                    className={`${titleSize} font-bold mb-2 block group-hover:!text-cyan-400 transition-colors ${size === "small" ? "truncate" : ""}`}
                >
                    {repo.name}
                </a>

                <p className={`text-[var(--text-muted)] line-clamp-2 mb-3 ${size === "small" ? "text-sm" : ""}`}>
                    {repo.description || "No description"}
                </p>

                {/* Topics */}
                {repo.topics.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {repo.topics.slice(0, 3).map((topic: string) => (
                            <span
                                key={topic}
                                className="px-2 py-0.5 text-xs rounded-full bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]"
                            >
                                {topic}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
