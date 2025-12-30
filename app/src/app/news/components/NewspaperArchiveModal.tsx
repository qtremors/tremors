/**
 * NewspaperArchiveModal - Full-screen archive browser with month navigation
 * Features: Month arrow navigation, scroll-based lazy loading, admin controls
 */

"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Check, Loader2, RotateCcw } from "lucide-react";

interface EditionSummary {
    id: string;
    date: string;
    createdAt: string; // Actual creation timestamp
    headline: string;
    isActive: boolean;
    isFallback: boolean;
}

interface ArchiveModalProps {
    isOpen: boolean;
    onClose: () => void;
    editions: EditionSummary[];
    isAdmin: boolean;
    currentEditionId?: string; // The edition currently being viewed (may differ from active)
    onLoadEdition: (id: string) => void;
    onSetActive: (id: string) => void;
    onResetToActive?: () => void; // Reset to the active edition
}

// Get month/year from a date
function getMonthYear(dateStr: string): { month: number; year: number; label: string } {
    const date = new Date(dateStr);
    return {
        month: date.getMonth(),
        year: date.getFullYear(),
        label: date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
    };
}

// Get unique months from editions
function getAvailableMonths(editions: EditionSummary[]): { month: number; year: number; label: string }[] {
    const seen = new Set<string>();
    return editions
        .map(e => getMonthYear(e.createdAt || e.date))
        .filter(my => {
            const key = `${my.year}-${my.month}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .sort((a, b) => {
            // Sort descending (newest first)
            if (a.year !== b.year) return b.year - a.year;
            return b.month - a.month;
        });
}

// Filter editions for a specific month
function getEditionsForMonth(editions: EditionSummary[], month: number, year: number, showFallbacks: boolean): EditionSummary[] {
    return editions
        .filter(e => {
            const d = new Date(e.createdAt || e.date);
            const monthMatch = d.getMonth() === month && d.getFullYear() === year;
            // Hide fallbacks from non-admins
            if (!showFallbacks && e.isFallback) return false;
            return monthMatch;
        })
        .sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()); // Latest first
}

export function NewspaperArchiveModal({
    isOpen,
    onClose,
    editions,
    isAdmin,
    currentEditionId,
    onLoadEdition,
    onSetActive,
    onResetToActive
}: ArchiveModalProps) {
    // Filter editions - only show fallbacks to admin
    const visibleEditions = isAdmin ? editions : editions.filter(e => !e.isFallback);

    // Get available months from visible editions
    const availableMonths = getAvailableMonths(visibleEditions);

    // Current month index (0 = most recent)
    const [monthIndex, setMonthIndex] = useState(0);

    // Number of editions to show (scroll-based lazy loading)
    const [visibleCount, setVisibleCount] = useState(8);

    // Loading state for individual editions
    const [loadingId, setLoadingId] = useState<string | null>(null);

    // Ref for scroll container
    const scrollRef = useRef<HTMLDivElement>(null);

    // Find the ONLY active edition
    const activeEdition = visibleEditions.find(e => e.isActive);
    const activeEditionId = activeEdition?.id;

    // Check if user is viewing a different edition than the active one
    const isViewingDifferent = currentEditionId && currentEditionId !== activeEditionId;

    const currentMonth = availableMonths[monthIndex] || {
        month: new Date().getMonth(),
        year: new Date().getFullYear(),
        label: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })
    };

    const monthEditions = getEditionsForMonth(visibleEditions, currentMonth.month, currentMonth.year, isAdmin);
    const displayEditions = monthEditions.slice(0, visibleCount);
    const hasMore = monthEditions.length > visibleCount;

    const canGoPrev = monthIndex > 0;
    const canGoNext = monthIndex < availableMonths.length - 1;

    // Scroll-based lazy loading
    useEffect(() => {
        const scrollEl = scrollRef.current;
        if (!scrollEl) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = scrollEl;
            // Load more when scrolled within 100px of bottom
            if (scrollHeight - scrollTop - clientHeight < 100 && hasMore) {
                setVisibleCount(c => c + 8);
            }
        };

        scrollEl.addEventListener("scroll", handleScroll);
        return () => scrollEl.removeEventListener("scroll", handleScroll);
    }, [hasMore]);

    // Reset visible count when changing month
    const handlePrev = useCallback(() => {
        if (canGoPrev) {
            setMonthIndex(i => i - 1);
            setVisibleCount(8);
        }
    }, [canGoPrev]);

    const handleNext = useCallback(() => {
        if (canGoNext) {
            setMonthIndex(i => i + 1);
            setVisibleCount(8);
        }
    }, [canGoNext]);

    const handleEditionClick = async (id: string) => {
        try {
            setLoadingId(id);
            await onLoadEdition(id);
            onClose();
        } catch (error) {
            console.error("Failed to load edition:", error);
        } finally {
            setLoadingId(null);
        }
    };

    const handleSetActive = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            setLoadingId(id);
            await onSetActive(id);
        } catch (error) {
            console.error("Failed to set active edition:", error);
        } finally {
            setLoadingId(null);
        }
    };

    const handleReset = () => {
        if (onResetToActive) {
            onResetToActive();
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="np-archive-modal-overlay" onClick={onClose}>
            <div className="np-archive-modal" onClick={e => e.stopPropagation()}>
                {/* Header with month navigation */}
                <div className="np-archive-modal-header">
                    <button
                        className="np-archive-nav-btn"
                        onClick={handlePrev}
                        disabled={!canGoPrev}
                        title="Newer"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h2 className="np-archive-modal-title">{currentMonth.label}</h2>
                    <button
                        className="np-archive-nav-btn"
                        onClick={handleNext}
                        disabled={!canGoNext}
                        title="Older"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                    <button className="np-archive-close-btn" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Edition count + Reset button */}
                <div className="np-archive-subheader">
                    <p className="np-archive-count">
                        {monthEditions.length} edition{monthEditions.length !== 1 ? "s" : ""} this month
                    </p>
                    {isViewingDifferent && onResetToActive && (
                        <button className="np-archive-reset-btn" onClick={handleReset}>
                            <RotateCcw className="w-3 h-3" />
                            Reset to Active
                        </button>
                    )}
                </div>

                {/* Scrollable editions grid */}
                <div className="np-archive-scroll" ref={scrollRef}>
                    {displayEditions.length > 0 ? (
                        <div className="np-archive-grid">
                            {displayEditions.map((edition, idx) => {
                                // Use createdAt for accurate time
                                const dateObj = new Date(edition.createdAt || edition.date);
                                const dayKey = dateObj.toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric"
                                });
                                const dayStr = dateObj.toLocaleDateString("en-US", {
                                    weekday: "short",
                                    day: "numeric"
                                });
                                const timeStr = dateObj.toLocaleTimeString("en-US", {
                                    hour: "numeric",
                                    minute: "2-digit"
                                });

                                // Check if this is a new day (different from previous)
                                const prevEdition = displayEditions[idx - 1];
                                const prevDayKey = prevEdition
                                    ? new Date(prevEdition.createdAt || prevEdition.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                                    : null;
                                const isNewDay = idx === 0 || dayKey !== prevDayKey;

                                // Only the REAL active edition gets the active styling
                                const isRealActive = edition.id === activeEditionId;

                                return (
                                    <React.Fragment key={edition.id}>
                                        {isNewDay && idx > 0 && (
                                            <div className="np-archive-day-separator">
                                                {dayKey}
                                            </div>
                                        )}
                                        <div
                                            className={`np-archive-item ${isRealActive ? "np-archive-item-active" : ""} ${edition.isFallback ? "np-archive-item-fallback" : ""}`}
                                            onClick={() => handleEditionClick(edition.id)}
                                        >
                                            <div className="np-archive-item-date">
                                                {dayStr} • {timeStr}
                                                {edition.isFallback && <span className="np-archive-fallback-badge">Fallback</span>}
                                            </div>
                                            <div className="np-archive-item-headline">
                                                {loadingId === edition.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                                                ) : null}
                                                {edition.headline}
                                            </div>
                                            {isAdmin && (
                                                <button
                                                    className={`np-archive-use-btn ${isRealActive ? "np-archive-use-btn-active" : ""}`}
                                                    onClick={(e) => handleSetActive(edition.id, e)}
                                                >
                                                    {isRealActive ? <Check className="w-3 h-3" /> : "Use"}
                                                </button>
                                            )}
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="np-archive-empty">
                            No editions for this month.
                        </div>
                    )}
                </div>

                {/* Admin-only Fallbacks Section */}
                {isAdmin && (() => {
                    const fallbackEditions = editions.filter(e => e.isFallback);
                    if (fallbackEditions.length === 0) return null;

                    return (
                        <div className="np-archive-fallbacks">
                            <div className="np-archive-fallbacks-header">
                                Fallback Editions ({fallbackEditions.length})
                            </div>
                            <div className="np-archive-fallbacks-grid">
                                {fallbackEditions.map(edition => {
                                    const dateObj = new Date(edition.createdAt || edition.date);
                                    const dateStr = dateObj.toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric"
                                    });
                                    const isRealActive = edition.id === activeEditionId;

                                    return (
                                        <div
                                            key={edition.id}
                                            className={`np-archive-fallback-item ${isRealActive ? "np-archive-item-active" : ""}`}
                                            onClick={() => handleEditionClick(edition.id)}
                                        >
                                            <span className="np-archive-fallback-date">{dateStr}</span>
                                            <span className="np-archive-fallback-headline">{edition.headline}</span>
                                            <button
                                                className={`np-archive-use-btn ${isRealActive ? "np-archive-use-btn-active" : ""}`}
                                                onClick={(e) => handleSetActive(edition.id, e)}
                                            >
                                                {isRealActive ? <Check className="w-3 h-3" /> : "Use"}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })()}
            </div>
        </div>
    );
}
