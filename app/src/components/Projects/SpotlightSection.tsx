/**
 * SpotlightSection - Featured projects grid layout
 */

"use client";

import { ProjectCard, RepoWithStatus } from "@/components/ProjectCard";

interface SpotlightSectionProps {
    spotlightRepos: RepoWithStatus[];
    viewMode: "grid" | "list";
    editMode: boolean;
    isAdmin: boolean;
    draggedId: number | null;
    dragOverId: number | null;
    showImages: boolean;
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

export function SpotlightSection({
    spotlightRepos,
    viewMode,
    editMode,
    isAdmin,
    draggedId,
    dragOverId,
    showImages,
    handlers,
}: SpotlightSectionProps) {
    if (spotlightRepos.length === 0) return null;

    if (viewMode === "list") {
        return (
            <div className="space-y-4">
                {spotlightRepos.map((repo) => (
                    <ProjectCard
                        key={repo.id}
                        repo={repo}
                        size="list"
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
        );
    }

    // Grid: 2+3 Bento Layout
    return (
        <div className="space-y-4">
            {/* Top row: 2 featured cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {spotlightRepos.slice(0, 2).map((repo, idx) => (
                    <div key={repo.id} className="md:col-span-2 aspect-[2/1]">
                        <ProjectCard
                            repo={repo}
                            size="large"
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
                    </div>
                ))}
            </div>

            {/* Bottom row: 3 featured cards */}
            {spotlightRepos.length > 2 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {spotlightRepos.slice(2, 5).map((repo) => (
                        <div key={repo.id} className="aspect-video md:aspect-square lg:aspect-[4/3]">
                            <ProjectCard
                                repo={repo}
                                size="medium"
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
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
