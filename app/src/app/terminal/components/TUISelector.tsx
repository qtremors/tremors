/**
 * TUISelector Component
 * Modal for selecting theme or font
 */

import type { TuiSelector as TuiSelectorType, ThemeColors, ThemeId } from "../lib/types";
import { THEMES } from "../lib/themes";

interface Props {
    selector: TuiSelectorType;
    theme: ThemeColors;
    onClose: () => void;
}

export function TUISelector({ selector, theme, onClose }: Props) {
    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
            onClick={onClose}
        >
            <div
                className="rounded-lg p-4 min-w-[200px]"
                style={{ backgroundColor: theme.panel, borderWidth: 1, borderColor: theme.border }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="text-center mb-3 text-sm" style={{ color: theme.muted }}>
                    Select {selector.type}
                </div>
                {selector.options.map((opt, i) => (
                    <div
                        key={opt}
                        className="px-4 py-2 rounded cursor-pointer text-sm"
                        style={{
                            backgroundColor: i === selector.selectedIndex ? theme.border : "transparent",
                            color: i === selector.selectedIndex ? theme.primary : theme.text,
                        }}
                    >
                        {selector.type === "theme" ? THEMES[opt as ThemeId].name : opt}
                    </div>
                ))}
                <div className="mt-3 text-center text-xs" style={{ color: theme.muted }}>
                    ↑↓ navigate • Enter select • Esc cancel
                </div>
            </div>
        </div>
    );
}
