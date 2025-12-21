/**
 * SkillsSection - Animated horizontal scrolling skill icons by category
 */

"use client";

import { SKILLS } from "@/config/site";
import {
    SiPython,
    SiDjango,
    SiFastapi,
    SiPostgresql,
    SiSqlite,
    SiReact,
    SiTypescript,
    SiNextdotjs,
    SiHtml5,
    SiTailwindcss,
    SiTensorflow,
    SiGoogle,
    SiNumpy,
    SiPandas,
    SiGit,
    SiDocker,
    SiLinux,
    SiVercel,
} from "@icons-pack/react-simple-icons";
import { Code2 } from "lucide-react";

// Map skill names to Simple Icons with brand colors
const iconMap: Record<string, { icon: React.ElementType; color: string }> = {
    Python: { icon: SiPython, color: "#3776AB" },
    Django: { icon: SiDjango, color: "#092E20" },
    FastAPI: { icon: SiFastapi, color: "#009688" },
    PostgreSQL: { icon: SiPostgresql, color: "#4169E1" },
    SQLite: { icon: SiSqlite, color: "#003B57" },
    React: { icon: SiReact, color: "#61DAFB" },
    TypeScript: { icon: SiTypescript, color: "#3178C6" },
    "Next.js": { icon: SiNextdotjs, color: "currentColor" },
    "HTML/CSS": { icon: SiHtml5, color: "#E34F26" },
    Tailwind: { icon: SiTailwindcss, color: "#06B6D4" },
    TensorFlow: { icon: SiTensorflow, color: "#FF6F00" },
    "Gemini API": { icon: SiGoogle, color: "#4285F4" },
    NumPy: { icon: SiNumpy, color: "#013243" },
    Pandas: { icon: SiPandas, color: "#150458" },
    Git: { icon: SiGit, color: "#F05032" },
    Docker: { icon: SiDocker, color: "#2496ED" },
    "VS Code": { icon: Code2, color: "#007ACC" },
    Linux: { icon: SiLinux, color: "#FCC624" },
    Vercel: { icon: SiVercel, color: "currentColor" },
};

// Skill icon component
const SkillIcon = ({ name }: { name: string }) => {
    const iconData = iconMap[name];
    if (!iconData) return null;

    const IconComponent = iconData.icon;
    if (IconComponent === Code2) {
        return <IconComponent className="w-5 h-5" style={{ color: iconData.color }} />;
    }
    return <IconComponent size={20} color={iconData.color} />;
};

export function SkillsSection() {
    return (
        <section className="mb-24">
            <div className="flex items-center gap-4 mb-10">
                <h2 className="text-3xl font-bold">Skills</h2>
                <span className="flex-1 h-px bg-[var(--border)]" />
            </div>

            {/* Each category on its own row */}
            <div className="space-y-4">
                {SKILLS.map((category, idx) => (
                    <div key={category.id} className="relative overflow-hidden">
                        {/* Fade edges */}
                        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[var(--bg)] to-transparent z-10" />
                        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[var(--bg)] to-transparent z-10" />

                        {/* Scrolling container - alternate direction for visual interest */}
                        <div
                            className={`flex gap-16 py-3 ${idx % 2 === 0 ? 'animate-marquee' : 'animate-marquee-reverse'}`}
                        >
                            {[...category.skills, ...category.skills, ...category.skills, ...category.skills].map((skill, i) => (
                                <div
                                    key={`${skill}-${i}`}
                                    className="flex items-center gap-2 shrink-0 hover:opacity-70 transition-opacity"
                                >
                                    <SkillIcon name={skill} />
                                    <span className="text-sm text-[var(--text-muted)] whitespace-nowrap">{skill}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
