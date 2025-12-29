/**
 * Loading Skeletons
 * Content-matching loading states for each page mode
 */

"use client";

// Base skeleton pulse component
export function Skeleton({ className = "" }: { className?: string }) {
    return (
        <div
            className={`animate-pulse bg-[var(--border)] rounded ${className}`}
        />
    );
}

// Default Mode skeleton - Hero + Projects Grid
export function DefaultLoadingSkeleton() {
    return (
        <div className="max-w-6xl mx-auto px-6 py-16">
            {/* Hero skeleton */}
            <section className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-24 min-h-[70vh]">
                <div className="order-2 lg:order-1">
                    <Skeleton className="w-32 h-6 mb-4" /> {/* Available badge */}
                    <Skeleton className="w-80 h-14 mb-4" /> {/* Name */}
                    <Skeleton className="w-56 h-8 mb-6" /> {/* Title */}
                    <Skeleton className="w-full max-w-lg h-20 mb-8" /> {/* Bio */}
                    <div className="flex gap-3"> {/* Navigation buttons */}
                        <Skeleton className="w-28 h-11 rounded-full" />
                        <Skeleton className="w-24 h-11 rounded-full" />
                        <Skeleton className="w-28 h-11 rounded-full" />
                    </div>
                </div>
                <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
                    <Skeleton className="w-80 h-56 rounded-2xl" /> {/* Code block */}
                </div>
            </section>

            {/* Projects Section skeleton */}
            <section className="mb-24">
                <div className="flex items-center gap-4 mb-10">
                    <Skeleton className="w-32 h-8" />
                    <div className="flex-1 h-px bg-[var(--border)]" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} className="h-48 rounded-xl" />
                    ))}
                </div>
            </section>

            {/* Skills Section skeleton */}
            <section className="mb-24">
                <div className="flex items-center gap-4 mb-10">
                    <Skeleton className="w-24 h-8" />
                    <div className="flex-1 h-px bg-[var(--border)]" />
                </div>
                <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                    ))}
                </div>
            </section>
        </div>
    );
}

// Paper Mode skeleton - Sidebar + Content
export function PaperLoadingSkeleton() {
    return (
        <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
            <div className="max-w-6xl mx-auto px-6 py-12">
                <div className="grid md:grid-cols-[240px_1fr] gap-12">
                    {/* Sidebar skeleton */}
                    <aside className="hidden md:block">
                        <div className="sticky top-24 space-y-4">
                            <Skeleton className="w-full h-6" />
                            <div className="space-y-2 pt-4">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <Skeleton key={i} className="w-full h-8" />
                                ))}
                            </div>
                        </div>
                    </aside>
                    {/* Main content skeleton */}
                    <main className="space-y-16">
                        {/* Hero */}
                        <section>
                            <Skeleton className="w-64 h-10 mb-4" />
                            <Skeleton className="w-48 h-6 mb-2" />
                            <Skeleton className="w-full h-20" />
                        </section>
                        {/* Content sections */}
                        {[1, 2, 3].map((i) => (
                            <section key={i}>
                                <Skeleton className="w-32 h-8 mb-4" />
                                <Skeleton className="w-full h-32" />
                            </section>
                        ))}
                    </main>
                </div>
            </div>
        </div>
    );
}

// Newspaper Mode skeleton - Editorial layout
export function NewspaperLoadingSkeleton() {
    return (
        <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
            {/* Masthead skeleton */}
            <header className="border-b border-[var(--border)] py-6 text-center">
                <Skeleton className="w-48 h-10 mx-auto mb-2" />
                <Skeleton className="w-32 h-4 mx-auto" />
            </header>

            <div className="max-w-6xl mx-auto px-6 py-8">
                {/* Headline skeleton */}
                <section className="border-b border-[var(--border)] pb-8 mb-8">
                    <Skeleton className="w-3/4 h-12 mx-auto mb-4" />
                    <Skeleton className="w-1/2 h-6 mx-auto" />
                </section>

                {/* Two-column layout skeleton */}
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <Skeleton className="w-full h-40" />
                        <Skeleton className="w-full h-32" />
                    </div>
                    <div className="space-y-6">
                        <Skeleton className="w-full h-32" />
                        <Skeleton className="w-full h-40" />
                    </div>
                </div>
            </div>
        </div>
    );
}

// Terminal Mode skeleton
export function TerminalLoadingSkeleton() {
    return (
        <div className="h-screen bg-[var(--bg)] flex flex-col items-center justify-center">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-3 h-3 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-3 h-3 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <p className="text-sm text-[var(--text-muted)] mt-4 animate-pulse">Loading terminal...</p>
        </div>
    );
}

// Generic loading - just dots (for fallback)
export function LoadingSkeleton() {
    return (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-3 h-3 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-3 h-3 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
        </div>
    );
}
