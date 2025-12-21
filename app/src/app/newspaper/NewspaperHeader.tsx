/**
 * NewspaperHeader - Conditional header for Newspaper mode
 * Shows full navbar only for admin, otherwise hidden
 */

"use client";

import { useAdmin } from "@/components/AdminContext";
import { Header } from "@/components/Header";

export function NewspaperHeader() {
    const { isAdmin } = useAdmin();

    // Only show header for admin users
    if (!isAdmin) return null;

    return <Header currentMode="newspaper" />;
}
