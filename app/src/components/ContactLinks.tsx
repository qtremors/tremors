/**
 * ContactLinks Component - Reusable contact links list
 * Uses CONTACT_LINKS from config for centralized management
 */

"use client";

import { CONTACT_LINKS } from "@/config/site";
import { Github, Linkedin, Mail, FileText, Twitter, Globe } from "lucide-react";

// Map contact link IDs to icons
const contactIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    email: Mail,
    github: Github,
    linkedin: Linkedin,
    resume: FileText,
    twitter: Twitter,
    website: Globe,
};

// Map contact link IDs to emoji (for paper mode)
const contactEmoji: Record<string, string> = {
    email: "📧",
    github: "🐙",
    linkedin: "💼",
    resume: "📄",
    twitter: "🐦",
    website: "🌐",
};

interface ContactLinksProps {
    variant?: "default" | "paper" | "icons-only";
    className?: string;
}

export function ContactLinks({ variant = "default", className = "" }: ContactLinksProps) {
    if (variant === "icons-only") {
        return (
            <div className={`flex items-center gap-3 ${className}`}>
                {CONTACT_LINKS.map((link) => {
                    const Icon = contactIcons[link.id] || Globe;
                    return (
                        <a
                            key={link.id}
                            href={link.url}
                            target={link.url.startsWith("http") ? "_blank" : undefined}
                            rel={link.url.startsWith("http") ? "noopener noreferrer" : undefined}
                            className="p-2 rounded-full border border-[var(--border)] hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)] transition-all"
                            title={link.label}
                        >
                            <Icon className="w-4 h-4" />
                        </a>
                    );
                })}
            </div>
        );
    }

    if (variant === "paper") {
        return (
            <ul className={`list-none p-0 ${className}`}>
                {CONTACT_LINKS.map((link) => {
                    const Icon = contactIcons[link.id] || Globe;
                    return (
                        <li key={link.id} className="mb-3">
                            <a
                                href={link.url}
                                target={link.url.startsWith("http") ? "_blank" : undefined}
                                rel={link.url.startsWith("http") ? "noopener noreferrer" : undefined}
                                className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity"
                            >
                                <Icon className="w-4 h-4" />
                                <span>{link.url.replace("mailto:", "").replace("https://", "")}</span>
                            </a>
                        </li>
                    );
                })}
            </ul>
        );
    }

    // Default variant - with icons and labels
    return (
        <div className={`space-y-3 ${className}`}>
            {CONTACT_LINKS.map((link) => {
                const Icon = contactIcons[link.id] || Globe;
                return (
                    <a
                        key={link.id}
                        href={link.url}
                        target={link.url.startsWith("http") ? "_blank" : undefined}
                        rel={link.url.startsWith("http") ? "noopener noreferrer" : undefined}
                        className="flex items-center gap-3 text-[var(--text-muted)] hover:text-[var(--accent-cyan)] transition-colors"
                    >
                        <Icon className="w-5 h-5" />
                        <span>{link.label}:</span>
                        <span className="text-[var(--text)]">
                            {link.url.replace("mailto:", "").replace("https://", "")}
                        </span>
                    </a>
                );
            })}
        </div>
    );
}
