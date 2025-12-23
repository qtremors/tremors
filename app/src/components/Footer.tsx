/**
 * Footer - Site footer with navigation, social links, and contact modal
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { PERSONAL, CONTACT_LINKS } from "@/config/site";
import { Terminal, FileText, Newspaper, Rocket, Github, Linkedin, Mail, MessageCircle } from "lucide-react";
import { ContactModal } from "./ContactModal";

const modes = [
    { id: "terminal", label: "Terminal", href: "/terminal", icon: Terminal },
    { id: "paper", label: "Resume", href: "/paper", icon: FileText },
    { id: "newspaper", label: "News", href: "/newspaper", icon: Newspaper },
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
    const [contactOpen, setContactOpen] = useState(false);

    return (
        <>
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

                        {/* Explore */}
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
                                            {mode.label}
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
                            <div className="flex gap-3 flex-wrap mb-4">
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
                            {/* Contact Form Button */}
                            <button
                                onClick={() => setContactOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--btn-bg)] text-[var(--btn-text)] hover:bg-[var(--btn-hover)] transition-colors text-sm font-medium"
                            >
                                <MessageCircle className="w-4 h-4" />
                                Send a Message
                            </button>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="pt-8 border-t border-[var(--border)] text-center text-sm text-[var(--text-muted)]">
                        <p>© {year} {PERSONAL.name}. All rights reserved.</p>
                    </div>
                </div>
            </footer>

            {/* Contact Modal */}
            <ContactModal isOpen={contactOpen} onClose={() => setContactOpen(false)} />
        </>
    );
}
