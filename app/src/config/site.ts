/**
 * Site Configuration
 * Centralized configuration for easy customization
 */

import type { ContactLink, SkillCategory, SectionConfig } from "@/types";

// Personal Info
export const PERSONAL = {
    name: "Tremors",
    handle: "Tremors",
    tagline: "Full-Stack Python Developer",
    bio: "Building AI-powered platforms, real-time systems, and advanced developer tooling.",
    location: "India",
    availableForWork: true,
} as const;

// Contact Links
export const CONTACT_LINKS: ContactLink[] = [
    {
        id: "email",
        label: "Email",
        url: "mailto:singhamankumar207@gmail.com",
        icon: "📧",
    },
    {
        id: "github",
        label: "GitHub",
        url: "https://github.com/qtremors",
        icon: "🐙",
    },
    {
        id: "linkedin",
        label: "LinkedIn",
        url: "https://www.linkedin.com/in/aman-singh-0a1938301",
        icon: "💼",
    },
    {
        id: "resume",
        label: "Resume",
        url: "/resume.pdf",
        icon: "📄",
    },
];

// Skills organized by category
export const SKILLS: SkillCategory[] = [
    {
        id: "backend",
        label: "Backend",
        skills: ["Python", "Django", "FastAPI", "PostgreSQL", "SQLite"],
    },
    {
        id: "frontend",
        label: "Frontend",
        skills: ["React", "TypeScript", "Next.js", "HTML/CSS", "Tailwind"],
    },
    {
        id: "ai-ml",
        label: "AI / ML",
        skills: ["TensorFlow", "Gemini API", "NumPy", "Pandas"],
    },
    {
        id: "tools",
        label: "Tools",
        skills: ["Git", "Docker", "VS Code", "Linux", "Vercel"],
    },
];

// Sections configuration (order and visibility)
export const SECTIONS: SectionConfig[] = [
    { id: "hero", title: "Hero", enabled: true, order: 0 },
    { id: "about", title: "About", enabled: true, order: 1 },
    { id: "skills", title: "Skills", enabled: true, order: 2 },
    { id: "projects", title: "Projects", enabled: true, order: 3 },
    { id: "activity", title: "Activity", enabled: true, order: 4 },
    { id: "contact", title: "Contact", enabled: true, order: 5 },
];

// GitHub configuration
export const GITHUB_CONFIG = {
    username: process.env.GITHUB_USERNAME || "qtremors",
    excludeTopic: "x",           // Repos with this topic are hidden
    featuredTopic: "portfolio",   // Repos with this topic are featured
    maxFeatured: 6,
    maxActivity: 10,
} as const;

// Data fetching limits (Q-002: centralized magic numbers)
export const DATA_LIMITS = {
    recentCommits: 30,      // Number of commits to fetch/cache
    recentActivity: 30,     // Number of activity items to display
    maxCommitsRefresh: 50,  // Max commits during admin refresh
    initialProjects: 5,     // Projects shown before "Load More"
    featuredProjects: 8,    // Max featured projects in newspaper mode
} as const;
