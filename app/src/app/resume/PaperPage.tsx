/**
 * Paper Mode - Reading/Document Style
 * Paper textured background with serif typography
 * Sidebar TOC + Main content area
 */

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { ModeProps } from "@/types";
import { PERSONAL, SKILLS, RESUME } from "@/config/site";
import { Download, Upload, Check } from "lucide-react";
import { ContactLinks } from "@/components/ContactLinks";
import { useAdmin } from "@/components/AdminContext";
import { useToast } from "@/components/ToastProvider";
import "./resume.css";

/**
 * Format project title - converts kebab-case to Title Case
 * "my-cool-project" -> "My Cool Project"
 */
function formatProjectTitle(name: string): string {
    return name
        .split(/[-_]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
}

// Table of contents sections
const sections = [
    { id: "intro", label: "Intro" },
    { id: "about", label: "About Me" },
    { id: "education", label: "Education" },
    { id: "experience", label: "Experience" },
    { id: "skills", label: "Skills" },
    { id: "projects", label: "Projects" },
    { id: "certifications", label: "Certifications" },
    { id: "contact", label: "Contact" },
] as const;

// Initial visible projects count
const INITIAL_PROJECTS = 5;

export function PaperPage({ data }: ModeProps) {
    const { repos, error } = data;
    const { isAdmin, editMode } = useAdmin();
    const toast = useToast();
    const [activeSection, setActiveSection] = useState("intro");
    const [visibleProjects, setVisibleProjects] = useState(INITIAL_PROJECTS);
    const [showAllProjects, setShowAllProjects] = useState(false);

    // Resume upload state
    const [resumeUrl, setResumeUrl] = useState("/Aman_Singh.pdf");
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Editable resume content state
    const [summary, setSummary] = useState<string>(RESUME.summary);
    const [about, setAbout] = useState<string[]>([...RESUME.about]);

    // Fetch current settings including resume content
    useEffect(() => {
        Promise.allSettled([
            fetch("/api/admin/resume").then(r => r.json()),
            fetch("/api/admin/settings").then(r => r.json()),
        ]).then((results) => {
            // Handle Resume Result
            if (results[0].status === 'fulfilled') {
                const resumeData = results[0].value;
                if (resumeData.url) setResumeUrl(resumeData.url);
            } else {
                console.error("Failed to fetch resume URL:", results[0].reason);
            }

            // Handle Settings Result
            if (results[1].status === 'fulfilled') {
                const settingsData = results[1].value;
                if (settingsData.settings?.resumeSummary) {
                    setSummary(settingsData.settings.resumeSummary);
                }
                if (settingsData.settings?.resumeAbout) {
                    try {
                        const parsed = JSON.parse(settingsData.settings.resumeAbout);
                        if (Array.isArray(parsed)) setAbout(parsed);
                    } catch { /* Use default */ }
                }
            } else {
                console.error("Failed to fetch settings:", results[1].reason);
            }
        });
    }, []);

    // Handle file upload
    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== "application/pdf") {
            toast.error("Only PDF files are allowed");
            return;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/admin/resume", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (data.success && data.url) {
                setResumeUrl(data.url);
                toast.success("Resume uploaded successfully!");
            } else {
                toast.error(data.error || "Upload failed");
            }
        } catch (err) {
            console.error("Upload error:", err);
            toast.error("Upload failed");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    // Save resume content to database
    const saveResumeContent = async (newSummary?: string, newAbout?: string[]) => {
        try {
            const body: Record<string, string> = {};
            if (newSummary !== undefined) body.resumeSummary = newSummary;
            if (newAbout !== undefined) body.resumeAbout = JSON.stringify(newAbout);

            const res = await fetch("/api/admin/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await res.json();
            if (data.success) {
                toast.success("Saved!");
            } else {
                toast.error(data.error || "Save failed");
            }
        } catch (err) {
            console.error("Save error:", err);
            toast.error("Save failed");
        }
    };

    if (error) {
        return <div className="paper-mode min-h-screen flex items-center justify-center text-red-600">{error}</div>;
    }

    // Track scroll position to update active section
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                // Find the entry with highest intersection ratio
                const visibleEntries = entries.filter(e => e.isIntersecting);
                if (visibleEntries.length > 0) {
                    // Get the one closest to top of viewport
                    const topEntry = visibleEntries.reduce((prev, curr) =>
                        prev.boundingClientRect.top < curr.boundingClientRect.top ? prev : curr
                    );
                    setActiveSection(topEntry.target.id);
                }
            },
            {
                rootMargin: "-80px 0px -60% 0px", // Account for header, activate when entering top 40%
                threshold: 0
            }
        );

        sections.forEach((section) => {
            const element = document.getElementById(section.id);
            if (element) observer.observe(element);
        });

        return () => observer.disconnect();
    }, []);

    const scrollToSection = (id: string) => {
        setActiveSection(id);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
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
                    {/* Hidden file input for upload */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept=".pdf,application/pdf"
                        onChange={handleUpload}
                        style={{ display: "none" }}
                    />

                    {isAdmin ? (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="paper-back-link"
                        >
                            <span className="flex items-center justify-center gap-2">
                                {isUploading ? (
                                    <Upload className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Upload className="w-4 h-4" />
                                )}
                                {isUploading ? "Uploading..." : "Upload Resume"}
                            </span>
                        </button>
                    ) : (
                        <a
                            href={resumeUrl}
                            download="Aman_Singh.pdf"
                            className="paper-back-link"
                        >
                            <span className="flex items-center justify-center gap-2">
                                <Download className="w-4 h-4" />
                                Download PDF
                            </span>
                        </a>
                    )}

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
                            <p
                                contentEditable={isAdmin && editMode}
                                suppressContentEditableWarning
                                onBlur={(e) => {
                                    if (isAdmin && editMode) {
                                        const newText = e.currentTarget.textContent || "";
                                        if (newText !== summary) {
                                            setSummary(newText);
                                            saveResumeContent(newText, undefined);
                                        }
                                    }
                                }}
                                className={isAdmin && editMode ? "outline-none focus:ring-2 focus:ring-[#8b7355] focus:ring-offset-2 rounded cursor-text" : ""}
                                style={isAdmin && editMode ? { minHeight: "1em" } : undefined}
                            >
                                {summary}
                            </p>
                        </section>

                        {/* ABOUT */}
                        <section id="about" className="paper-section">
                            <h2>About Me</h2>
                            {about.map((paragraph, i) => (
                                <p
                                    key={i}
                                    contentEditable={isAdmin && editMode}
                                    suppressContentEditableWarning
                                    onBlur={(e) => {
                                        if (isAdmin && editMode) {
                                            const newText = e.currentTarget.textContent || "";
                                            if (newText !== about[i]) {
                                                const newAbout = [...about];
                                                newAbout[i] = newText;
                                                setAbout(newAbout);
                                                saveResumeContent(undefined, newAbout);
                                            }
                                        }
                                    }}
                                    className={isAdmin && editMode ? "outline-none focus:ring-2 focus:ring-[#8b7355] focus:ring-offset-2 rounded cursor-text" : ""}
                                >
                                    {paragraph}
                                </p>
                            ))}
                        </section>

                        {/* EDUCATION */}
                        <section id="education" className="paper-section">
                            <h2>Education</h2>
                            {RESUME.education.map((edu, i) => (
                                <div key={i} className="paper-entry">
                                    <h3>{edu.institution}</h3>
                                    <p><strong>{edu.degree}</strong></p>
                                    <p>CGPA: {edu.cgpa} • Graduation: {edu.graduation}</p>
                                </div>
                            ))}
                        </section>

                        {/* EXPERIENCE */}
                        <section id="experience" className="paper-section">
                            <h2>Experience</h2>
                            {RESUME.experience.map((exp, i) => (
                                <div key={i} className="paper-entry">
                                    <h3>{exp.title}</h3>
                                    <p><strong>{exp.company}</strong>, {exp.location}</p>
                                    <p className="paper-date">{exp.period}</p>
                                    <ul className="paper-bullets">
                                        {exp.bullets.map((bullet, j) => (
                                            <li key={j}>{bullet}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </section>

                        {/* SKILLS */}
                        <section id="skills" className="paper-section">
                            <h2>Technical Skills</h2>
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
                                <div key={repo.id} className="paper-entry">
                                    <h3>{formatProjectTitle(repo.name)}</h3>
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
                                    onClick={() => {
                                        const firstNewIndex = visibleProjects;
                                        setShowAllProjects(true);
                                        // Scroll to the first newly revealed project
                                        setTimeout(() => {
                                            const projectEntries = document.querySelectorAll('#projects .paper-entry');
                                            if (projectEntries[firstNewIndex]) {
                                                projectEntries[firstNewIndex].scrollIntoView({ behavior: 'smooth', block: 'start' });
                                            }
                                        }, 50);
                                    }}
                                    className="paper-load-more"
                                >
                                    Load More Projects...
                                </button>
                            )}

                            {showAllProjects && visibleRepos.length > INITIAL_PROJECTS && (
                                <button
                                    onClick={() => {
                                        // Standard collapse: scroll to section header first, then collapse
                                        document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        // Delay collapse until scroll animation completes
                                        setTimeout(() => {
                                            setShowAllProjects(false);
                                        }, 300);
                                    }}
                                    className="paper-load-more"
                                >
                                    Show Less
                                </button>
                            )}
                        </section>

                        {/* CERTIFICATIONS */}
                        <section id="certifications" className="paper-section">
                            <h2>Certifications</h2>
                            <ul className="paper-certifications">
                                {RESUME.certifications.map((cert, i) => (
                                    <li key={i}>
                                        <strong>{cert.name}</strong> – {cert.issuer} – {cert.date}
                                    </li>
                                ))}
                            </ul>
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
                    </main>
                </div>
            </div>
        </div>
    );
}
