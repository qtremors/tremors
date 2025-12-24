/**
 * Header - Simple navbar with logo, admin controls, and theme toggle
 * Nav buttons slide in from hero when scrolled
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";
import { useAdmin } from "@/components/AdminContext";
import { useToast } from "@/components/ToastProvider";
import { useNavButtons } from "@/components/NavButtonsContext";
import { PERSONAL } from "@/config/site";
import { Terminal, Moon, Sun, Pencil, RefreshCw, Check, FolderOpen, Newspaper, FileText } from "lucide-react";

interface HeaderProps {
    currentMode: "default" | "paper" | "newspaper" | "terminal" | "nexus";
}

export function Header({ currentMode }: HeaderProps) {
    const { theme, toggleTheme } = useTheme();
    const { isAdmin, editMode, setEditMode } = useAdmin();
    const { showInHeader } = useNavButtons();
    const toast = useToast();
    const [refreshing, setRefreshing] = useState(false);

    // Refresh data from GitHub
    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            const res = await fetch("/api/admin/refresh", { method: "POST" });
            if (res.ok) {
                toast.success("Data refreshed from GitHub");
                window.location.reload();
            } else {
                toast.error("Failed to refresh");
            }
        } catch {
            toast.error("Failed to refresh");
        } finally {
            setRefreshing(false);
        }
    };

    // Hide header on terminal mode (it has its own UI)
    if (currentMode === "terminal") return null;

    // Motion Link for animated buttons
    const MotionLink = motion.create(Link);

    return (
        <>
            {/* Desktop: Simple navbar - fully transparent */}
            <header className="hidden md:flex fixed top-0 left-0 right-0 z-40 px-6 py-4 items-center justify-between bg-transparent">

                {/* Logo */}
                <Link
                    href="/"
                    className="flex items-center gap-2 text-lg font-bold hover:opacity-80 transition-opacity"
                >
                    <span className={`relative w-5 h-5 ${isAdmin ? "admin-logo-glow" : ""}`}>
                        <img src="/alien.svg" alt="Tremors logo" className="w-full h-full relative z-10" />
                    </span>
                    <span>{PERSONAL.handle.toLowerCase()}</span>
                </Link>

                {/* Center: Nav buttons that slide in from hero */}
                <AnimatePresence>
                    {showInHeader && currentMode === "default" && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4 px-5 py-2 rounded-full"
                            style={{
                                background: 'radial-gradient(ellipse at center, color-mix(in srgb, var(--bg) 50%, transparent) 0%, transparent 80%)',
                                backdropFilter: 'blur(6px)',
                                WebkitBackdropFilter: 'blur(6px)',
                            }}
                        >
                            <motion.a
                                href="#projects"
                                layoutId="btn-projects"
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            >
                                <FolderOpen className="w-4 h-4" />
                                Projects
                            </motion.a>
                            <MotionLink
                                href="/news"
                                layoutId="btn-news"
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            >
                                <Newspaper className="w-4 h-4" />
                                News
                            </MotionLink>
                            <MotionLink
                                href="/resume"
                                layoutId="btn-resume"
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            >
                                <FileText className="w-4 h-4" />
                                Resume
                            </MotionLink>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Right: Admin controls + Theme toggle */}
                <div className="flex items-center gap-2">
                    {/* Admin Controls - Only visible when logged in */}
                    {isAdmin && (
                        <>
                            {/* Refresh Button */}
                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className={`p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--border)]/50 transition-all ${refreshing ? "animate-spin" : ""
                                    }`}
                                title="Refresh from GitHub"
                            >
                                <RefreshCw className="w-5 h-5" />
                            </button>
                            {/* Edit Toggle */}
                            <button
                                onClick={() => setEditMode(!editMode)}
                                className={`p-2 rounded-lg transition-all ${editMode
                                    ? "text-green-400 bg-green-500/10"
                                    : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--border)]/50"
                                    }`}
                                title={editMode ? "Save and exit edit mode" : "Edit projects"}
                            >
                                {editMode ? <Check className="w-5 h-5" /> : <Pencil className="w-5 h-5" />}
                            </button>
                        </>
                    )}

                    {/* Nexus Portal Link */}
                    <a
                        href="https://qtremors.github.io"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="nexus-portal-link p-2 rounded-lg transition-all"
                        title="Main Portfolio"
                        aria-label="Go to Main Portfolio"
                    >
                        <img
                            src="/blackhole-icon.png"
                            alt="Portal"
                            className="w-6 h-6 nexus-portal-icon"
                        />
                    </a>

                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--border)]/50 transition-all"
                        title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                    >
                        {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                </div>
            </header>

            {/* Mobile: Simple top bar - fully transparent */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-40 px-4 py-3 flex items-center justify-between bg-transparent">
                <Link href="/" className="flex items-center gap-2 font-bold">
                    <img src="/alien.svg" alt="Tremors logo" className="w-5 h-5" />
                    <span className={currentMode === "newspaper" ? (theme === "dark" ? "text-[#1a1a1a]" : "text-[#f5f0e8]") : ""}>{PERSONAL.handle.toLowerCase()}</span>
                </Link>

                <div className="flex items-center gap-1">
                    {isAdmin && (
                        <>
                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className={`p-2 rounded-lg text-[var(--text-muted)] ${refreshing ? "animate-spin" : ""}`}
                                title="Refresh data"
                            >
                                <RefreshCw className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setEditMode(!editMode)}
                                className={`p-2 rounded-lg ${editMode ? "text-green-400 bg-green-500/10" : "text-[var(--text-muted)]"}`}
                                title={editMode ? "Exit edit mode" : "Enter edit mode"}
                            >
                                {editMode ? <Check className="w-5 h-5" /> : <Pencil className="w-5 h-5" />}
                            </button>
                        </>
                    )}
                    <a
                        href="https://qtremors.github.io"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="nexus-portal-link p-2 rounded-lg"
                        title="Main Portfolio"
                    >
                        <img src="/blackhole-icon.png" alt="Portal" className="w-6 h-6 nexus-portal-icon" />
                    </a>
                    <button onClick={toggleTheme} className="p-2 rounded-lg text-[var(--text-muted)]" title="Toggle theme">
                        {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                </div>
            </div>
        </>
    );
}
