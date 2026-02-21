/**
 * Admin Context - Manages admin authentication and edit mode state
 * Admin login happens in Terminal, state verified via server-side cookie
 */

"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from "react";

interface AdminContextType {
    isAdmin: boolean;
    setIsAdmin: (value: boolean) => void;
    editMode: boolean;
    setEditMode: (value: boolean) => void;
    refreshAdminStatus: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

// Cache admin check in sessionStorage to avoid redundant API calls
const ADMIN_CACHE_KEY = "admin_status_checked";

export function AdminProvider({ children }: { children: ReactNode }) {
    const [isAdmin, setIsAdmin] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const hasChecked = useRef(false);
    const lastCheckTime = useRef(0);

    const checkAdminStatus = useCallback(async (isFocusCheck = false) => {
        const now = Date.now();
        // Don't re-check more than once every 30 seconds on focus (prevent spam)
        if (isFocusCheck && now - lastCheckTime.current < 30000) return;
        
        lastCheckTime.current = now;
        try {
            const res = await fetch("/api/auth/check");
            if (!res.ok) throw new Error("Network response was not ok");
            const data = await res.json();
            setIsAdmin(!!data.isAdmin);
        } catch {
            // Silently ignore network errors on focus check, don't logout
            if (!isFocusCheck) setIsAdmin(false);
        }
    }, []);

    // Verify admin session on initial mount
    useEffect(() => {
        if (hasChecked.current) return;
        hasChecked.current = true;
        checkAdminStatus();
    }, [checkAdminStatus]);

    // Recheck on window focus (in case session expired while tab was hidden)
    useEffect(() => {
        const handleFocus = () => {
            if (document.visibilityState === "visible") {
                checkAdminStatus(true);
            }
        };

        document.addEventListener("visibilitychange", handleFocus);
        return () => document.removeEventListener("visibilitychange", handleFocus);
    }, [checkAdminStatus]);

    return (
        <AdminContext.Provider value={{ isAdmin, setIsAdmin, editMode, setEditMode, refreshAdminStatus: checkAdminStatus }}>
            {children}
        </AdminContext.Provider>
    );
}

export function useAdmin() {
    const context = useContext(AdminContext);
    if (!context) {
        throw new Error("useAdmin must be used within AdminProvider");
    }
    return context;
}

