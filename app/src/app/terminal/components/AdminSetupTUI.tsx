/**
 * Admin Setup TUI
 * First-time password setup interface for creating admin account
 * Uses CSS text-security instead of type="password" to avoid browser password managers
 */

"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import type { ThemeColors } from "../lib/types";

interface Props {
    theme: ThemeColors;
    onSuccess: () => void;
    onCancel: () => void;
}

export function AdminSetupTUI({ theme, onSuccess, onCancel }: Props) {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [activeField, setActiveField] = useState<"password" | "confirm">("password");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const passwordRef = useRef<HTMLInputElement>(null);
    const confirmRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        passwordRef.current?.focus();
    }, []);

    const handleSubmit = async () => {
        setError(null);

        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "setup",
                    password,
                    confirmPassword,
                }),
            });

            const data = await res.json();
            if (data.success) {
                onSuccess();
            } else {
                setError(data.error || "Failed to create account");
            }
        } catch {
            setError("Network error. Please try again.");
        }
        setLoading(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
            onCancel();
        } else if (e.key === "Tab") {
            e.preventDefault();
            if (activeField === "password") {
                setActiveField("confirm");
                confirmRef.current?.focus();
            } else {
                setActiveField("password");
                passwordRef.current?.focus();
            }
        } else if (e.key === "Enter") {
            if (activeField === "password" && password.length > 0) {
                setActiveField("confirm");
                confirmRef.current?.focus();
            } else if (activeField === "confirm") {
                handleSubmit();
            }
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
            onClick={onCancel}
        >
            <div
                className="w-full max-w-md mx-4 rounded-lg border p-6"
                style={{
                    backgroundColor: theme.panel,
                    borderColor: theme.border,
                    color: theme.text,
                }}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={handleKeyDown}
            >
                {/* Header */}
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">🔐</span>
                    <h2 className="text-lg font-bold">Create Admin Account</h2>
                </div>

                <div
                    className="h-px mb-4"
                    style={{ backgroundColor: theme.border }}
                />

                {/* Description */}
                <p className="text-sm mb-6" style={{ color: theme.muted }}>
                    No admin account exists. Create one to manage your portfolio
                    from the terminal.
                </p>

                {/* Password field */}
                <div className="mb-4">
                    <label
                        className="block text-xs uppercase tracking-wider mb-2"
                        style={{ color: theme.muted }}
                    >
                        New Password
                    </label>
                    <input
                        ref={passwordRef}
                        type="text"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setActiveField("password")}
                        className="w-full px-4 py-2 rounded border bg-transparent text-sm"
                        style={{
                            borderColor: activeField === "password" ? theme.primary : theme.border,
                            color: theme.text,
                            caretColor: theme.primary,
                            WebkitTextSecurity: "disc",
                        } as React.CSSProperties}
                        placeholder="Enter password"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck={false}
                        data-lpignore="true"
                        data-form-type="other"
                    />
                </div>

                {/* Confirm password field */}
                <div className="mb-4">
                    <label
                        className="block text-xs uppercase tracking-wider mb-2"
                        style={{ color: theme.muted }}
                    >
                        Confirm Password
                    </label>
                    <input
                        ref={confirmRef}
                        type="text"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onFocus={() => setActiveField("confirm")}
                        className="w-full px-4 py-2 rounded border bg-transparent text-sm"
                        style={{
                            borderColor: activeField === "confirm" ? theme.primary : theme.border,
                            color: theme.text,
                            caretColor: theme.primary,
                            WebkitTextSecurity: "disc",
                        } as React.CSSProperties}
                        placeholder="Confirm password"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck={false}
                        data-lpignore="true"
                        data-form-type="other"
                    />
                </div>

                {/* Requirements */}
                <div
                    className="text-xs mb-4 p-3 rounded"
                    style={{ backgroundColor: theme.bg }}
                >
                    <p style={{ color: password.length >= 8 ? theme.success : theme.muted }}>
                        {password.length >= 8 ? "✓" : "○"} At least 8 characters
                    </p>
                    <p style={{ color: password === confirmPassword && password.length > 0 ? theme.success : theme.muted }}>
                        {password === confirmPassword && password.length > 0 ? "✓" : "○"} Passwords match
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <p className="text-sm mb-4" style={{ color: theme.error }}>
                        {error}
                    </p>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                    <button
                        onClick={handleSubmit}
                        disabled={loading || password.length < 8 || password !== confirmPassword}
                        className="flex-1 px-4 py-2 rounded font-medium text-sm disabled:opacity-50 transition-opacity"
                        style={{
                            backgroundColor: theme.primary,
                            color: theme.bg,
                        }}
                    >
                        {loading ? "Creating..." : "Create Account"}
                    </button>
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded text-sm border"
                        style={{
                            borderColor: theme.border,
                            color: theme.muted,
                        }}
                    >
                        Cancel
                    </button>
                </div>

                {/* Keyboard hints */}
                <p
                    className="text-xs text-center mt-4"
                    style={{ color: theme.muted }}
                >
                    Tab: Switch field • Enter: Submit • Esc: Cancel
                </p>
            </div>
        </div>
    );
}
