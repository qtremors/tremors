/**
 * useFetch - Custom hook for API data fetching with loading and error states
 * B-002: Repeated fetch patterns abstraction
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/components/ToastProvider";

interface UseFetchOptions<T> {
    /** Initial data value */
    initialData?: T;
    /** Whether to fetch immediately on mount */
    immediate?: boolean;
    /** Whether to show error toast on failure */
    showError?: boolean;
    /** Custom error message */
    errorMessage?: string;
}

interface UseFetchReturn<T> {
    data: T | null;
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

export function useFetch<T>(
    url: string,
    options: UseFetchOptions<T> = {}
): UseFetchReturn<T> {
    const {
        initialData = null,
        immediate = true,
        showError = true,
        errorMessage = "Failed to load data",
    } = options;

    const [data, setData] = useState<T | null>(initialData);
    const [loading, setLoading] = useState(immediate);
    const [error, setError] = useState<Error | null>(null);
    const toast = useToast();
    const toastRef = useRef(toast);

    useEffect(() => {
        toastRef.current = toast;
    }, [toast]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(url);
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
            const json = await res.json();
            setData(json);
        } catch (err) {
            const error = err instanceof Error ? err : new Error("Unknown error");
            setError(error);
            if (showError) {
                toastRef.current.error(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    }, [url, showError, errorMessage]);

    useEffect(() => {
        if (immediate) {
            fetchData();
        }
    }, [immediate, fetchData]);

    return { data, loading, error, refetch: fetchData };
}
