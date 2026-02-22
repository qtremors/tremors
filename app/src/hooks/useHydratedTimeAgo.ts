"use client";

import { useState, useEffect } from "react";

/**
 * Returns a hydration-safe "time ago" string.
 * During SSR/initial render, returns the initial timestamp or null.
 * After hydration, returns the calculated relative time avoiding mismatch errors.
 */
export function useHydratedTimeAgo(timestampString: string | null | undefined): string | null {
    const [timeAgo, setTimeAgo] = useState<string | null>(null);

    useEffect(() => {
        if (!timestampString) {
            setTimeAgo(null);
            return;
        }

        const diff = Date.now() - new Date(timestampString).getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (days > 0) {
            setTimeAgo(`${days}d ago`);
        } else if (hours > 0) {
            setTimeAgo(`${hours}h ago`);
        } else {
            setTimeAgo("just now");
        }
    }, [timestampString]);

    return timeAgo;
}
