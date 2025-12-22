/**
 * Footer - Site footer with navigation, social links, and mode switcher
 */

import Link from "next/link";
import { PERSONAL, CONTACT_LINKS } from "@/config/site";
import { Terminal, FileText, Newspaper, Rocket, Github, Linkedin, Mail, Heart } from "lucide-react";

const modes = [
    { id: "terminal", label: "Terminal", href: "/terminal", icon: Terminal },
    { id: "paper", label: "Paper", href: "/paper", icon: FileText },
    { id: "newspaper", label: "Newspaper", href: "/newspaper", icon: Newspaper },
    { id: "nexus", label: "Nexus", href: "/nexus", icon: Rocket },
];

const getContactUrl = (id: string) => CONTACT_LINKS.find((l) => l.id === id)?.url || "#";

const socialIcons: Record<string, React.ElementType> = {
    github: Github,
    linkedin: Linkedin,
    email: Mail,
};

export function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="border-t border-[var(--border)] bg-[var(--bg-secondary)]">
            <div className="max-w-6xl mx-auto px-6 py-12">
                <div className="grid md:grid-cols-3 gap-8 mb-8">
                    {/* Brand */}
                    <div>
                        <Link href="/" className="text-xl font-bold mb-3 block">
                            {PERSONAL.handle}
                        </Link>
                        <p className="text-sm text-[var(--text-muted)] max-w-xs">
                            {PERSONAL.bio}
                        </p>
                    </div>

                    {/* Explore Modes */}
                    <div>
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-4">
                            Explore
                        </h4>
                        <ul className="space-y-2">
                            {modes.map((mode) => (
                                <li key={mode.id}>
                                    <Link
                                        href={mode.href}
                                        className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                                    >
                                        <mode.icon className="w-4 h-4" />
                                        {mode.label} Mode
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Connect */}
                    <div>
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-4">
                            Connect
                        </h4>
                        <div className="flex gap-3 flex-wrap">
                            {["github", "linkedin", "email"].map((id) => {
                                const Icon = socialIcons[id];
                                const url = getContactUrl(id);
                                return (
                                    <a
                                        key={id}
                                        href={url}
                                        target={id !== "email" ? "_blank" : undefined}
                                        rel="noopener noreferrer"
                                        className="w-11 h-11 sm:w-10 sm:h-10 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--accent)] transition-all"
                                    >
                                        <Icon className="w-5 h-5 sm:w-4 sm:h-4" />
                                    </a>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-[var(--border)] flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-[var(--text-muted)]">
                    <p>© {year} {PERSONAL.name}. All rights reserved.</p>
                    <p className="flex items-center gap-1">
                        Built with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> using Next.js
                    </p>
                </div>
            </div>
        </footer>
    );
}
