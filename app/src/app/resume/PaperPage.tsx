/**
 * Paper Mode - Reading/Document Style
 * Paper textured background with serif typography
 * Sidebar TOC + Main content area
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { ModeProps } from "@/types";
import { PERSONAL, SKILLS } from "@/config/site";
import { ArrowLeft, Check } from "lucide-react";
import { ContactLinks } from "@/components/ContactLinks";
import "./paper.css";

// Table of contents sections
const sections = [
    { id: "intro", label: "Intro" },
    { id: "about", label: "About Me" },
    { id: "skills", label: "My Skills" },
    { id: "projects", label: "Projects" },
    { id: "contact", label: "Contact" },
] as const;

// Initial visible projects count
const INITIAL_PROJECTS = 5;

export function PaperPage({ data }: ModeProps) {
    const { repos, error } = data;
    const [activeSection, setActiveSection] = useState("intro");
    const [visibleProjects, setVisibleProjects] = useState(INITIAL_PROJECTS);
    const [showAllProjects, setShowAllProjects] = useState(false);

    if (error) {
        return <div className="paper-mode min-h-screen flex items-center justify-center text-red-600">{error}</div>;
    }

    // Track scroll position to update active section
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id);
                    }
                });
            },
            { rootMargin: "-45% 0px -45% 0px" }
        );

        sections.forEach((section) => {
            const element = document.getElementById(section.id);
            if (element) observer.observe(element);
        });

        return () => observer.disconnect();
    }, []);

    const scrollToSection = (id: string) => {
        setActiveSection(id);
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    };

    // Get visible repos (filter hidden ones)
    const visibleRepos = repos.filter(r => !r.hidden);
    const displayedRepos = showAllProjects ? visibleRepos : visibleRepos.slice(0, visibleProjects);
    const hasMoreProjects = visibleRepos.length > visibleProjects && !showAllProjects;

    return (
        <div className="paper-mode">
            <div className="paper-layout pt-16 md:pt-0">
                {/* TOC Sidebar - Desktop only */}
                <aside className="paper-sidebar">
                    <Link href="/" className="paper-back-link">
                        <span className="flex items-center justify-center gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Main
                        </span>
                    </Link>

                    <nav className="paper-toc">
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => scrollToSection(section.id)}
                                className={`paper-toc-link ${activeSection === section.id ? "active" : ""}`}
                            >
                                {section.label}
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Main Content */}
                <div className="paper-main">
                    <main className="paper-container">
                        {/* INTRO */}
                        <section id="intro" className="paper-section">
                            <h1>{PERSONAL.name}</h1>
                            <p><strong>{PERSONAL.tagline}</strong></p>
                            <p>{PERSONAL.bio}</p>
                        </section>

                        {/* ABOUT */}
                        <section id="about" className="paper-section">
                            <h2>About Me</h2>
                            <p>
                                I am a Computer Science graduate and a {PERSONAL.tagline} focused on the Django and
                                FastAPI ecosystems. I build scalable backend systems and web applications,
                                with experience ranging from real-time features using WebSockets to
                                integrating generative AI models into production-ready apps.
                            </p>
                            <p>
                                Beyond application development, I enjoy building utilities that improve workflows
                                or solve specific system-level problems. My recent work includes creating a CLI for
                                Git visualization, a remote control API for system management, and a custom
                                Terminal UI. I appreciate the details of how software interacts with the underlying
                                system and strive to write clean, efficient code.
                            </p>
                            <p>
                                Currently, I am working on combining traditional web engineering with LLM capabilities
                                to create smarter applications. I am looking for a developer role where I can apply
                                my skills in Python and modern web technologies to build reliable and practical software.
                            </p>
                        </section>

                        {/* SKILLS */}
                        <section id="skills" className="paper-section">
                            <h2>My Skills</h2>
                            {SKILLS.map((category) => (
                                <div key={category.id}>
                                    <h3>{category.label}</h3>
                                    <ul className="paper-skills-inline">
                                        {category.skills.map((skill) => (
                                            <li key={skill}>{skill}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </section>

                        {/* PROJECTS */}
                        <section id="projects" className="paper-section">
                            <h2>Projects</h2>
                            {displayedRepos.map((repo) => (
                                <div key={repo.id}>
                                    <h3>{repo.name}</h3>
                                    <p>{repo.description || "No description available."}</p>
                                    <p>
                                        {repo.homepage && (
                                            <>
                                                <a href={repo.homepage} target="_blank" rel="noopener noreferrer">Website</a>
                                                {" • "}
                                            </>
                                        )}
                                        <a href={repo.html_url} target="_blank" rel="noopener noreferrer">GitHub</a>
                                    </p>
                                </div>
                            ))}

                            {hasMoreProjects && (
                                <button
                                    onClick={() => setShowAllProjects(true)}
                                    className="paper-load-more"
                                >
                                    Load More Projects...
                                </button>
                            )}

                            {showAllProjects && visibleRepos.length > INITIAL_PROJECTS && (
                                <button
                                    onClick={() => setShowAllProjects(false)}
                                    className="paper-load-more"
                                >
                                    Show Less
                                </button>
                            )}
                        </section>

                        {/* CONTACT */}
                        <section id="contact" className="paper-section">
                            <h2>Contact</h2>
                            <p>Interested in working together? Feel free to reach out:</p>
                            <ContactLinks variant="paper" className="paper-contact-list" />

                            {PERSONAL.availableForWork && (
                                <div className="paper-available">
                                    <Check className="w-4 h-4" />
                                    <span>Available for new opportunities</span>
                                </div>
                            )}
                        </section>

                        {/* FOOTER */}
                        <footer className="paper-footer">
                            <p>© {new Date().getFullYear()} {PERSONAL.name}. All rights reserved.</p>
                            <p style={{ marginTop: "0.5rem" }}>
                                <Link href="/">Full Portfolio</Link>
                                {" • "}
                                <Link href="/terminal">Terminal Mode</Link>
                            </p>
                        </footer>
                    </main>
                </div>
            </div>
        </div>
    );
}
