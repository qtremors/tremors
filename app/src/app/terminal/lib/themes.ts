/**
 * Terminal Themes
 * Color schemes for the terminal
 */

import type { ThemeId, ThemeColors } from "./types";

export const THEMES: Record<ThemeId, ThemeColors> = {
    dracula: {
        name: "Dracula",
        bg: "#282a36",
        text: "#f8f8f2",
        primary: "#8be9fd",
        secondary: "#bd93f9",
        muted: "#6272a4",
        error: "#ff5555",
        success: "#50fa7b",
        system: "#f1fa8c",
        panel: "#44475a",
        border: "#6272a4",
    },
    tokyonight: {
        name: "Tokyo Night",
        bg: "#1a1b26",
        text: "#c0caf5",
        primary: "#7aa2f7",
        secondary: "#bb9af7",
        muted: "#565f89",
        error: "#f7768e",
        success: "#9ece6a",
        system: "#e0af68",
        panel: "#24283b",
        border: "#414868",
    },
    rosepine: {
        name: "Rosé Pine",
        bg: "#191724",
        text: "#e0def4",
        primary: "#9ccfd8",
        secondary: "#c4a7e7",
        muted: "#524f67",
        error: "#eb6f92",
        success: "#9ccfd8",
        system: "#f6c177",
        panel: "#1f1d2e",
        border: "#26233a",
    },
};

export const FONT_CLASSES: Record<"mono" | "sans" | "serif", string> = {
    mono: "font-mono",
    sans: "font-sans",
    serif: "font-serif",
};
