/**
 * Terminal Page - Modular TUI Style
 * Main terminal component using extracted command handlers
 * Includes secure admin authentication via secret command
 */

"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import type { ModeProps } from "@/types";
import { PERSONAL } from "@/config/site";
import { useAdmin } from "@/components/AdminContext";

// Local imports
import {
    CommandBlock as CommandBlockType,
    TerminalLine,
    ThemeId,
    FontId,
    TuiSelector,
    THEMES,
    FONT_CLASSES,
} from "./lib";
import { commands, type CommandContext } from "./lib/commands";
import {
    CommandBlock,
    AsciiLogo,
    CommandItem,
    TerminalInput,
    StatusBar,
    CommandAutocomplete,
    InlineSelector,
    InlineAdminSetup,
    InlineAdminManage,
} from "./components";

// Session info type
interface SessionInfo {
    expiresIn: number;
}

export function TerminalPage({ data }: ModeProps) {
    const router = useRouter();
    const { user, repos, error } = data;
    const { isAdmin, setIsAdmin } = useAdmin();

    // State
    const [commandBlocks, setCommandBlocks] = useState<CommandBlockType[]>([]);
    const [input, setInput] = useState("");
    const [awaitingPassword, setAwaitingPassword] = useState(false);
    const [shakeAscii, setShakeAscii] = useState(false);
    const [shakeInput, setShakeInput] = useState(false);
    const [termTheme, setTermTheme] = useState<ThemeId>("rosepine");
    const [termFont, setTermFont] = useState<FontId>("mono");
    const [crtEffect, setCrtEffect] = useState(false);
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [tuiSelector, setTuiSelector] = useState<TuiSelector | null>(null);
    const [autocompleteIndex, setAutocompleteIndex] = useState(0);

    // Admin TUI states
    const [showAdminSetup, setShowAdminSetup] = useState(false);
    const [showAdminManage, setShowAdminManage] = useState(false);
    const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);

    // Refs
    const inputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const asciiRef = useRef<HTMLPreElement>(null);
    const tuiRef = useRef<HTMLDivElement>(null);

    const theme = THEMES[termTheme];

    // Load saved settings AND session
    useEffect(() => {
        const savedTheme = localStorage.getItem("termTheme");
        const savedFont = localStorage.getItem("termFont");
        const savedSession = localStorage.getItem("termSession");
        const savedHistory = localStorage.getItem("termHistory");

        if (savedTheme && (savedTheme === "dracula" || savedTheme === "tokyonight" || savedTheme === "rosepine")) setTermTheme(savedTheme);
        if (savedFont && (savedFont === "mono" || savedFont === "firacode" || savedFont === "jetbrains")) setTermFont(savedFont);
        // Note: hiddenRepos is no longer in localStorage - repos are filtered by DB
        if (savedSession) {
            try {
                const session = JSON.parse(savedSession);
                if (Array.isArray(session) && session.length > 0) {
                    setCommandBlocks(session);
                }
            } catch { }
        }
        if (savedHistory) {
            try {
                const history = JSON.parse(savedHistory);
                if (Array.isArray(history)) {
                    setCommandHistory(history);
                }
            } catch { }
        }
    }, []);

    useEffect(() => { localStorage.setItem("termTheme", termTheme); }, [termTheme]);
    useEffect(() => { localStorage.setItem("termFont", termFont); }, [termFont]);

    // Save session to localStorage
    useEffect(() => {
        if (commandBlocks.length > 0) {
            localStorage.setItem("termSession", JSON.stringify(commandBlocks));
        }
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [commandBlocks]);

    // Save command history
    useEffect(() => {
        if (commandHistory.length > 0) {
            localStorage.setItem("termHistory", JSON.stringify(commandHistory));
        }
    }, [commandHistory]);

    // Auto-scroll when TUIs appear to keep them visible (same as command output)
    useEffect(() => {
        if (tuiSelector || showAdminSetup || showAdminManage) {
            setTimeout(() => {
                tuiRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
            }, 50);
        }
    }, [tuiSelector, showAdminSetup, showAdminManage]);

    // Auto-scroll to input after command output (U-003)
    useEffect(() => {
        if (commandBlocks.length > 0) {
            // Scroll input into view after short delay to ensure render is complete
            setTimeout(() => {
                inputRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
            }, 50);
        }
    }, [commandBlocks]);

    const focusInput = () => inputRef.current?.focus();

    const isAsciiVisible = () => {
        if (!asciiRef.current || !scrollRef.current) return true;
        const rect = asciiRef.current.getBoundingClientRect();
        const container = scrollRef.current.getBoundingClientRect();
        return rect.bottom > container.top && rect.top < container.bottom;
    };

    const triggerErrorShake = () => {
        if (isAsciiVisible()) {
            setShakeAscii(true);
            setTimeout(() => setShakeAscii(false), 500);
        } else {
            setShakeInput(true);
            setTimeout(() => setShakeInput(false), 500);
        }
    };

    const addCommandBlock = (command: string, lines: TerminalLine[]) => {
        setCommandBlocks(prev => [...prev, { command, lines }]);
    };

    // Check if input is the secret admin command
    const checkSecretCommand = async (cmd: string): Promise<{
        isSecret: boolean;
        needsSetup?: boolean;
        isLoggedIn?: boolean;
        sessionInfo?: SessionInfo;
    }> => {
        try {
            const res = await fetch("/api/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: cmd }),
            });
            const data = await res.json();
            if (data.success && data.isSecret) {
                return {
                    isSecret: true,
                    needsSetup: data.needsSetup,
                    isLoggedIn: data.isLoggedIn,
                    sessionInfo: data.sessionInfo,
                };
            }
        } catch { /* ignore */ }
        return { isSecret: false };
    };

    // Handle password input for login
    const handlePasswordInput = async (password: string) => {
        try {
            const res = await fetch("/api/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "login", password }),
            });
            const data = await res.json();
            if (data.success) {
                setIsAdmin(true);
                addCommandBlock("password", [{ type: "success", content: "Authentication successful. Admin mode enabled." }]);
            } else {
                addCommandBlock("password", [{ type: "error", content: data.error || "Authentication failed." }]);
                triggerErrorShake();
            }
        } catch {
            addCommandBlock("password", [{ type: "error", content: "Server error." }]);
            triggerErrorShake();
        }
        setAwaitingPassword(false);
    };

    const processCommand = async (cmd: string) => {
        const trimmed = cmd.trim();
        const trimmedLower = trimmed.toLowerCase();
        if (!trimmed) return;

        // Password input for admin login
        if (awaitingPassword) {
            await handlePasswordInput(trimmed);
            return;
        }

        const parts = trimmedLower.split(" ");
        const command = parts[0];
        const args = parts.slice(1);

        // Build command context - hiddenRepos is empty set since DB filters repos
        const hiddenRepos = new Set<string>();
        const ctx: CommandContext = {
            repos, user, hiddenRepos, isAdmin, termTheme, termFont, commandHistory, commandBlocks
        };

        // Check if command exists
        const handler = commands[command];
        if (handler) {
            const result = handler(args, ctx);

            // Handle actions
            if (result.action === "clear") {
                setCommandBlocks([]);
                setCommandHistory([]);
                localStorage.removeItem("termSession");
                localStorage.removeItem("termHistory");
            } else if (result.action === "exit") {
                addCommandBlock(cmd, result.lines);
                setTimeout(() => router.push("/"), 500);
            } else if (result.action === "openThemeSelector") {
                setTuiSelector({ type: "theme", options: Object.keys(THEMES), selectedIndex: Object.keys(THEMES).indexOf(termTheme) });
                return; // Don't process further - TUI will handle
            } else if (result.action === "openFontSelector") {
                const fonts: FontId[] = ["mono", "firacode", "jetbrains"];
                setTuiSelector({ type: "font", options: fonts, selectedIndex: fonts.indexOf(termFont) });
                return; // Don't process further - TUI will handle
            } else if (result.action === "toggleCrt") {
                setCrtEffect(c => !c);
                addCommandBlock(cmd, result.lines);

            } else if (result.action === "logout") {
                // Call logout API to clear server-side cookie
                fetch("/api/auth/logout", { method: "POST" }).catch(() => { });
                setIsAdmin(false);
                addCommandBlock(cmd, result.lines);
            } else {
                if (result.lines.length > 0) addCommandBlock(cmd, result.lines);
            }

            // Handle repo actions via API (not localStorage)
            if (result.repoToHide) {
                // Find the repo and call API to hide it
                const repo = repos.find(r => r.name.toLowerCase() === result.repoToHide?.toLowerCase());
                if (repo) {
                    fetch("/api/admin/repos", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: repo.id, hidden: true }),
                    }).catch(err => console.error("Failed to hide repo:", err));
                }
            }
            if (result.repoToShow) {
                // Find the repo and call API to show it
                const repo = repos.find(r => r.name.toLowerCase() === result.repoToShow?.toLowerCase());
                if (repo) {
                    fetch("/api/admin/repos", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: repo.id, hidden: false }),
                    }).catch(err => console.error("Failed to show repo:", err));
                }
            }
            if (result.newFont) setTermFont(result.newFont);

            // Check for errors to shake
            if (result.lines.some(l => l.type === "error")) triggerErrorShake();
        } else {
            // Check for secret admin command
            const secretCheck = await checkSecretCommand(command);

            if (secretCheck.isSecret) {
                if (secretCheck.needsSetup) {
                    // No admin account - show setup TUI
                    setShowAdminSetup(true);
                } else if (secretCheck.isLoggedIn) {
                    // Already logged in - show management TUI
                    setSessionInfo(secretCheck.sessionInfo || null);
                    setShowAdminManage(true);
                } else {
                    // Need to login - prompt for password
                    setAwaitingPassword(true);
                    addCommandBlock(cmd, [{ type: "system", content: "password:" }]);
                }
                setCommandHistory(prev => [...prev.slice(-49), trimmedLower]);
                return;
            }

            // Unknown command
            addCommandBlock(cmd, [
                { type: "error", content: `Command not found: ${command}` },
                { type: "output", content: "Type /commands for available commands." }
            ]);
            triggerErrorShake();
        }

        if (trimmedLower && command !== "history") {
            setCommandHistory(prev => [...prev.slice(-49), trimmedLower]);
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        // Close TUIs on escape
        if (e.key === "Escape") {
            if (tuiSelector) {
                setTuiSelector(null);
                return;
            }
            if (showAdminSetup) {
                setShowAdminSetup(false);
                return;
            }
            if (showAdminManage) {
                setShowAdminManage(false);
                return;
            }
        }

        // Block input when inline TUIs are active (they handle their own keyboard)
        if (tuiSelector || showAdminSetup || showAdminManage) {
            return;
        }

        if (e.key === "Enter") {
            // Check if there are autocomplete matches - if so, autocomplete and execute
            const trimmed = input.trim().toLowerCase();
            const searchTerm = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;
            const cmds = Object.keys(commands).filter(c => !c.startsWith("/") && !c.startsWith(":"));
            const matches = cmds.filter(c => c.startsWith(searchTerm));

            if (matches.length > 0 && trimmed && !cmds.includes(searchTerm)) {
                // Autocomplete with selected match and execute
                const completedCmd = `/${matches[autocompleteIndex % matches.length]}`;
                processCommand(completedCmd);
            } else {
                processCommand(input);
            }
            setInput("");
            setHistoryIndex(-1);
            setAutocompleteIndex(0);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (commandHistory.length > 0) {
                const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
                setHistoryIndex(newIndex);
                setInput(commandHistory[commandHistory.length - 1 - newIndex] || "");
            }
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            if (historyIndex > 0) {
                const newIndex = historyIndex - 1;
                setHistoryIndex(newIndex);
                setInput(commandHistory[commandHistory.length - 1 - newIndex] || "");
            } else if (historyIndex === 0) {
                setHistoryIndex(-1);
                setInput("");
            }
        } else if (e.key === "Tab") {
            e.preventDefault();
            const cmds = Object.keys(commands).filter(c => !c.startsWith("/") && !c.startsWith(":"));
            const searchTerm = input.trim().toLowerCase().startsWith("/")
                ? input.trim().toLowerCase().slice(1)
                : input.trim().toLowerCase();
            const matches = cmds.filter(c => c.startsWith(searchTerm));

            if (matches.length > 0) {
                // Complete with current selection
                setInput(`/${matches[autocompleteIndex % matches.length]}`);
                // Cycle to next match for next Tab press
                setAutocompleteIndex(prev => (prev + 1) % matches.length);
            }
        }
    };

    // Admin setup success callback
    const handleAdminSetupSuccess = () => {
        setShowAdminSetup(false);
        setIsAdmin(true);
        addCommandBlock("setup", [{ type: "success", content: "Admin account created. You are now logged in." }]);
    };

    // Admin logout callback
    const handleAdminLogout = () => {
        setShowAdminManage(false);
        setIsAdmin(false);
        addCommandBlock("logout", [{ type: "success", content: "Logged out successfully." }]);
    };

    if (error) return <div className="h-screen bg-[#191724] text-[#eb6f92] p-8 font-mono">{error}</div>;

    return (
        <div
            className={`h-screen ${FONT_CLASSES[termFont]} flex flex-col overflow-hidden ${crtEffect ? 'crt-effect' : ''}`}
            style={{ backgroundColor: theme.bg, color: theme.text }}
            onClick={focusInput}
        >
            <div ref={scrollRef} className="flex-1 overflow-y-auto flex flex-col">
                <div className={`flex flex-col items-center justify-center ${commandBlocks.length === 0 ? 'flex-1' : 'pt-8 pb-4'}`}>
                    <AsciiLogo ref={asciiRef} theme={theme} shaking={shakeAscii} />
                    <p className="text-xs mb-6" style={{ color: theme.muted }}>{PERSONAL.tagline} • v2.0</p>

                    {commandBlocks.length === 0 && (
                        <>
                            <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-sm max-w-sm text-left mb-6">
                                <CommandItem cmd="/whoami" desc="profile" colors={theme} />
                                <CommandItem cmd="/projects" desc="repos" colors={theme} />
                                <CommandItem cmd="/neofetch" desc="sysinfo" colors={theme} />
                                <CommandItem cmd="/theme" desc="colors" colors={theme} />
                                <CommandItem cmd="/commands" desc="all" colors={theme} />
                                <CommandItem cmd="exit" desc="go back" colors={theme} />
                            </div>
                            <p className="text-xs" style={{ color: theme.muted }}>Type /commands to see all available commands</p>
                        </>
                    )}
                </div>

                {commandBlocks.length > 0 && (
                    <div className="px-6 pb-4 max-w-3xl mx-auto w-full space-y-4">
                        {commandBlocks.map((block, i) => (
                            <CommandBlock key={i} block={block} theme={theme} />
                        ))}
                    </div>
                )}

                {/* Inline TUIs - inside scroll area so they push content up */}
                {tuiSelector && (
                    <div ref={tuiRef} className="p-4 max-w-3xl mx-auto w-full">
                        <InlineSelector
                            type={tuiSelector.type}
                            options={tuiSelector.options}
                            selectedIndex={tuiSelector.selectedIndex}
                            theme={theme}
                            onSelect={(value) => {
                                const type = tuiSelector.type;
                                if (type === "theme") {
                                    setTermTheme(value as ThemeId);
                                    const themeName = THEMES[value as ThemeId].name;
                                    addCommandBlock("/theme", [{ type: "success", content: `Theme applied: ${themeName}` }]);
                                } else {
                                    setTermFont(value as FontId);
                                    const fontNames: Record<string, string> = { mono: "System Mono", firacode: "Fira Code", jetbrains: "JetBrains Mono" };
                                    addCommandBlock("/font", [{ type: "success", content: `Font applied: ${fontNames[value]}` }]);
                                }
                                setTuiSelector(null);
                            }}
                            onNavigate={(dir) => {
                                setTuiSelector(p => p ? {
                                    ...p,
                                    selectedIndex: dir === "up"
                                        ? Math.max(0, p.selectedIndex - 1)
                                        : Math.min(p.options.length - 1, p.selectedIndex + 1)
                                } : null);
                            }}
                            onCancel={() => setTuiSelector(null)}
                        />
                    </div>
                )}
                {showAdminSetup && (
                    <div ref={tuiRef} className="p-4 max-w-3xl mx-auto w-full">
                        <InlineAdminSetup
                            theme={theme}
                            onSuccess={handleAdminSetupSuccess}
                            onCancel={() => setShowAdminSetup(false)}
                        />
                    </div>
                )}
                {showAdminManage && (
                    <div ref={tuiRef} className="p-4 max-w-3xl mx-auto w-full">
                        <InlineAdminManage
                            theme={theme}
                            onLogout={handleAdminLogout}
                            onClose={() => setShowAdminManage(false)}
                            sessionInfo={sessionInfo}
                        />
                    </div>
                )}
            </div>

            {/* Command autocomplete suggestions */}
            {!tuiSelector && !showAdminSetup && !showAdminManage && !awaitingPassword && (
                <CommandAutocomplete
                    input={input}
                    commands={Object.keys(commands)}
                    theme={theme}
                    selectedIndex={autocompleteIndex}
                />
            )}

            <TerminalInput
                ref={inputRef}
                value={input}
                onChange={(val) => {
                    setInput(val);
                    setAutocompleteIndex(0); // Reset selection when typing
                }}
                onKeyDown={handleKeyDown}
                theme={theme}
                awaitingPassword={awaitingPassword}
                shaking={shakeInput}
            />

            <StatusBar theme={theme} themeId={termTheme} font={termFont} isAdmin={isAdmin} />


        </div>
    );
}
