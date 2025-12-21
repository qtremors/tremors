/**
 * Admin Management TUI
 * Management interface shown when admin types secret command while logged in
 * Options: Change Password, Logout, Cancel
 */

"use client";

import { useState, useEffect, KeyboardEvent } from "react";
import type { ThemeColors } from "../lib/types";

interface Props {
    theme: ThemeColors;
    onLogout: () => void;
    onClose: () => void;
    sessionInfo?: { expiresIn: number } | null;
}

type MenuOption = "changePassword" | "logout" | "cancel";
type View = "menu" | "changePassword";

export function AdminManageTUI({ theme, onLogout, onClose, sessionInfo }: Props) {
    const [view, setView] = useState<View>("menu");
    const [selectedOption, setSelectedOption] = useState<MenuOption>("changePassword");

    // Change password state
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [activeField, setActiveField] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const menuOptions: { id: MenuOption; label: string }[] = [
        { id: "changePassword", label: "Change Password" },
        { id: "logout", label: "Logout" },
        { id: "cancel", label: "Cancel" },
    ];

    const formatExpiresIn = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `in ${hours}h ${minutes}m`;
        }
        return `in ${minutes}m`;
    };

    const handleMenuKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
            onClose();
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            const idx = menuOptions.findIndex((o) => o.id === selectedOption);
            const newIdx = idx > 0 ? idx - 1 : menuOptions.length - 1;
            setSelectedOption(menuOptions[newIdx].id);
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            const idx = menuOptions.findIndex((o) => o.id === selectedOption);
            const newIdx = idx < menuOptions.length - 1 ? idx + 1 : 0;
            setSelectedOption(menuOptions[newIdx].id);
        } else if (e.key === "Enter") {
            handleMenuSelect(selectedOption);
        }
    };

    const handleMenuSelect = (option: MenuOption) => {
        if (option === "changePassword") {
            setView("changePassword");
            setActiveField(0);
        } else if (option === "logout") {
            handleLogout();
        } else {
            onClose();
        }
    };

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            onLogout();
        } catch {
            setError("Failed to logout");
        }
    };

    const handleChangePassword = async () => {
        setError(null);
        setSuccess(null);

        if (!currentPassword) {
            setError("Current password is required");
            return;
        }
        if (newPassword.length < 8) {
            setError("New password must be at least 8 characters");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("New passwords do not match");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "changePassword",
                    currentPassword,
                    newPassword,
                }),
            });

            const data = await res.json();
            if (data.success) {
                setSuccess("Password changed successfully!");
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setTimeout(() => {
                    setView("menu");
                    setSuccess(null);
                }, 1500);
            } else {
                setError(data.error || "Failed to change password");
            }
        } catch {
            setError("Network error. Please try again.");
        }
        setLoading(false);
    };

    const handlePasswordKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
            setView("menu");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setError(null);
        } else if (e.key === "Tab") {
            e.preventDefault();
            setActiveField((prev) => (prev + 1) % 3);
        } else if (e.key === "Enter") {
            if (activeField < 2) {
                setActiveField(activeField + 1);
            } else {
                handleChangePassword();
            }
        }
    };

    // Focus handling for menu
    useEffect(() => {
        const handleGlobalKeyDown = (e: globalThis.KeyboardEvent) => {
            if (view === "menu") {
                handleMenuKeyDown(e as unknown as KeyboardEvent);
            }
        };

        window.addEventListener("keydown", handleGlobalKeyDown);
        return () => window.removeEventListener("keydown", handleGlobalKeyDown);
    }, [view, selectedOption]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
            onClick={onClose}
        >
            <div
                className="w-full max-w-md mx-4 rounded-lg border p-6"
                style={{
                    backgroundColor: theme.panel,
                    borderColor: theme.border,
                    color: theme.text,
                }}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={view === "changePassword" ? handlePasswordKeyDown : undefined}
            >
                {view === "menu" ? (
                    <>
                        {/* Header */}
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-xl">⚙️</span>
                            <h2 className="text-lg font-bold">Admin Management</h2>
                        </div>

                        <div className="h-px mb-4" style={{ backgroundColor: theme.border }} />

                        {/* Session info */}
                        <div className="text-sm mb-4" style={{ color: theme.muted }}>
                            <p>Logged in as: <span style={{ color: theme.success }}>admin</span></p>
                            {sessionInfo && (
                                <p>Session expires: {formatExpiresIn(sessionInfo.expiresIn)}</p>
                            )}
                        </div>

                        {/* Menu options */}
                        <div className="rounded border" style={{ borderColor: theme.border }}>
                            {menuOptions.map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => handleMenuSelect(option.id)}
                                    className="w-full text-left px-4 py-3 flex items-center gap-2 transition-colors"
                                    style={{
                                        backgroundColor: selectedOption === option.id ? theme.bg : "transparent",
                                        color: selectedOption === option.id ? theme.primary : theme.text,
                                        borderBottom: option.id !== "cancel" ? `1px solid ${theme.border}` : "none",
                                    }}
                                >
                                    <span style={{ color: theme.primary }}>
                                        {selectedOption === option.id ? "→" : " "}
                                    </span>
                                    {option.label}
                                </button>
                            ))}
                        </div>

                        {/* Error */}
                        {error && (
                            <p className="text-sm mt-4" style={{ color: theme.error }}>
                                {error}
                            </p>
                        )}

                        {/* Keyboard hints */}
                        <p className="text-xs text-center mt-4" style={{ color: theme.muted }}>
                            ↑↓ Navigate • Enter: Select • Esc: Close
                        </p>
                    </>
                ) : (
                    <>
                        {/* Change Password View */}
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-xl">🔄</span>
                            <h2 className="text-lg font-bold">Change Password</h2>
                        </div>

                        <div className="h-px mb-4" style={{ backgroundColor: theme.border }} />

                        {/* Current password */}
                        <div className="mb-4">
                            <label className="block text-xs uppercase tracking-wider mb-2" style={{ color: theme.muted }}>
                                Current Password
                            </label>
                            <input
                                type="text"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                onFocus={() => setActiveField(0)}
                                className="w-full px-4 py-2 rounded border bg-transparent text-sm"
                                style={{
                                    borderColor: activeField === 0 ? theme.primary : theme.border,
                                    color: theme.text,
                                    caretColor: theme.primary,
                                    WebkitTextSecurity: "disc",
                                } as React.CSSProperties}
                                autoComplete="off"
                                autoCorrect="off"
                                autoCapitalize="off"
                                spellCheck={false}
                                data-lpignore="true"
                                data-form-type="other"
                                autoFocus
                            />
                        </div>

                        {/* New password */}
                        <div className="mb-4">
                            <label className="block text-xs uppercase tracking-wider mb-2" style={{ color: theme.muted }}>
                                New Password
                            </label>
                            <input
                                type="text"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                onFocus={() => setActiveField(1)}
                                className="w-full px-4 py-2 rounded border bg-transparent text-sm"
                                style={{
                                    borderColor: activeField === 1 ? theme.primary : theme.border,
                                    color: theme.text,
                                    caretColor: theme.primary,
                                    WebkitTextSecurity: "disc",
                                } as React.CSSProperties}
                                autoComplete="off"
                                autoCorrect="off"
                                autoCapitalize="off"
                                spellCheck={false}
                                data-lpignore="true"
                                data-form-type="other"
                            />
                        </div>

                        {/* Confirm new password */}
                        <div className="mb-4">
                            <label className="block text-xs uppercase tracking-wider mb-2" style={{ color: theme.muted }}>
                                Confirm New Password
                            </label>
                            <input
                                type="text"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                onFocus={() => setActiveField(2)}
                                className="w-full px-4 py-2 rounded border bg-transparent text-sm"
                                style={{
                                    borderColor: activeField === 2 ? theme.primary : theme.border,
                                    color: theme.text,
                                    caretColor: theme.primary,
                                    WebkitTextSecurity: "disc",
                                } as React.CSSProperties}
                                autoComplete="off"
                                autoCorrect="off"
                                autoCapitalize="off"
                                spellCheck={false}
                                data-lpignore="true"
                                data-form-type="other"
                            />
                        </div>

                        {/* Error / Success */}
                        {error && (
                            <p className="text-sm mb-4" style={{ color: theme.error }}>
                                {error}
                            </p>
                        )}
                        {success && (
                            <p className="text-sm mb-4" style={{ color: theme.success }}>
                                {success}
                            </p>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                            <button
                                onClick={handleChangePassword}
                                disabled={loading}
                                className="flex-1 px-4 py-2 rounded font-medium text-sm disabled:opacity-50"
                                style={{
                                    backgroundColor: theme.primary,
                                    color: theme.bg,
                                }}
                            >
                                {loading ? "Updating..." : "Update Password"}
                            </button>
                            <button
                                onClick={() => {
                                    setView("menu");
                                    setCurrentPassword("");
                                    setNewPassword("");
                                    setConfirmPassword("");
                                    setError(null);
                                }}
                                className="px-4 py-2 rounded text-sm border"
                                style={{
                                    borderColor: theme.border,
                                    color: theme.muted,
                                }}
                            >
                                Back
                            </button>
                        </div>

                        {/* Keyboard hints */}
                        <p className="text-xs text-center mt-4" style={{ color: theme.muted }}>
                            Tab: Switch field • Enter: Submit • Esc: Back
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
