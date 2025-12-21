/**
 * HeroSection - Animated hero with code block, floating particles, and CTAs
 * Admin can click the available line to toggle availability status
 */

"use client";

import { useEffect, useState, useRef } from "react";
import { PERSONAL, CONTACT_LINKS } from "@/config/site";
import { ArrowRight, Github, Linkedin, Mail } from "lucide-react";
import { useAdmin } from "@/components/AdminContext";
import { useToast } from "@/components/ToastProvider";

// Helper to get URL from CONTACT_LINKS by id
const getContactUrl = (id: string): string => {
    return CONTACT_LINKS.find((link) => link.id === id)?.url || "#";
};

// Floating particles background animation - optimized with visibility pause
function FloatingParticles() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationId: number;
        let isVisible = true;
        let particles: Array<{
            x: number;
            y: number;
            vx: number;
            vy: number;
            size: number;
            opacity: number;
        }> = [];

        const resize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };

        const createParticles = () => {
            particles = [];
            // Reduced particle density for better performance
            const count = Math.min(Math.floor((canvas.width * canvas.height) / 25000), 40);
            for (let i = 0; i < count; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 0.3,
                    vy: (Math.random() - 0.5) * 0.3,
                    size: Math.random() * 2 + 1,
                    opacity: Math.random() * 0.5 + 0.1,
                });
            }
        };

        const draw = () => {
            if (!isVisible) {
                animationId = requestAnimationFrame(draw);
                return;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach((p) => {
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(34, 211, 238, ${p.opacity})`;
                ctx.fill();
            });

            // Draw connections (optimized: reduced connection distance)
            particles.forEach((p1, i) => {
                particles.slice(i + 1).forEach((p2) => {
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 100) {
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = `rgba(34, 211, 238, ${0.1 * (1 - dist / 100)})`;
                        ctx.stroke();
                    }
                });
            });

            animationId = requestAnimationFrame(draw);
        };

        resize();
        createParticles();
        draw();

        // Pause when tab is hidden
        const handleVisibility = () => {
            isVisible = document.visibilityState === "visible";
        };
        document.addEventListener("visibilitychange", handleVisibility);

        // Store handler reference for proper cleanup
        const handleResize = () => {
            resize();
            createParticles();
        };
        window.addEventListener("resize", handleResize);

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener("resize", handleResize);
            document.removeEventListener("visibilitychange", handleVisibility);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ opacity: 0.6 }}
        />
    );
}

// Animated floating code block with admin-editable availability
interface AnimatedCodeBlockProps {
    availableForWork: boolean;
    onToggle?: () => void;
    isAdmin: boolean;
    editMode: boolean;
}

function AnimatedCodeBlock({ availableForWork, onToggle, isAdmin, editMode }: AnimatedCodeBlockProps) {
    const [activeIndex, setActiveIndex] = useState(0);

    const lines = [
        { text: "class Developer:", color: "var(--accent-cyan)", editable: false },
        { text: `    name = "${PERSONAL.name}"`, color: "var(--text)", editable: false },
        { text: `    role = "${PERSONAL.tagline}"`, color: "var(--text)", editable: false },
        { text: '    focus = ["AI", "Backend", "DevTools"]', color: "var(--text)", editable: false },
        {
            text: `    available = ${availableForWork ? "True" : "False"}`,
            color: availableForWork ? "var(--success)" : "var(--text-muted)",
            editable: true
        },
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % lines.length);
        }, 2000);
        return () => clearInterval(timer);
    }, [lines.length]);

    const handleLineClick = (index: number) => {
        if (isAdmin && editMode && lines[index].editable && onToggle) {
            onToggle();
        }
    };

    return (
        <div className="relative">
            <div className="absolute inset-0 bg-[var(--accent-cyan)] opacity-10 blur-3xl rounded-full" />
            <div className="relative bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-8 backdrop-blur-sm animate-float">
                <div className="flex items-center gap-2 mb-6">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="ml-4 text-xs text-[var(--text-muted)] font-mono">developer.py</span>
                </div>
                <pre className="font-mono text-sm md:text-base">
                    {lines.map((line, i) => (
                        <div
                            key={i}
                            onClick={() => handleLineClick(i)}
                            className={`transition-all duration-500 ${i === activeIndex ? "translate-x-2 opacity-100" : "opacity-60"
                                } ${line.editable && isAdmin && editMode
                                    ? "cursor-pointer hover:bg-[var(--accent-cyan)]/10 hover:scale-[1.02] rounded px-1 -mx-1"
                                    : ""
                                }`}
                            style={{ color: line.color }}
                            title={line.editable && isAdmin && editMode ? "Click to toggle availability" : undefined}
                        >
                            {line.text}
                        </div>
                    ))}
                </pre>
                <span className="inline-block w-2 h-5 bg-[var(--accent-cyan)] animate-pulse mt-2" />
            </div>
        </div>
    );
}

export function HeroSection() {
    const { isAdmin, editMode } = useAdmin();
    const toast = useToast();
    const [availableForWork, setAvailableForWork] = useState<boolean>(PERSONAL.availableForWork);

    // Fetch current availability from DB
    useEffect(() => {
        fetch("/api/admin/availability")
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setAvailableForWork(data.availableForWork);
                }
            })
            .catch(() => {
                // Silently fail - use default value from config
            });
    }, []);

    // Toggle availability
    const handleToggleAvailability = async () => {
        const newValue = !availableForWork;
        try {
            const res = await fetch("/api/admin/availability", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ availableForWork: newValue }),
            });
            const data = await res.json();
            if (data.success) {
                setAvailableForWork(newValue);
                toast.success(`Availability set to ${newValue ? "True" : "False"}`);
            } else {
                toast.error(data.error || "Failed to update");
            }
        } catch {
            toast.error("Failed to update availability");
        }
    };

    return (
        <section className="relative grid lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-24 min-h-[70vh]">
            {/* Background Animation */}
            <FloatingParticles />

            {/* Left - Text Content */}
            <div className="relative order-2 lg:order-1">
                <p className="text-[var(--accent-cyan)] font-medium mb-3 flex items-center gap-2">
                    <span className="w-8 h-px bg-[var(--accent-cyan)]" />
                    Hi, I&apos;m
                </p>

                <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">{PERSONAL.name}</h1>

                <h2 className="text-2xl md:text-3xl text-[var(--text-muted)] font-light mb-6">
                    {PERSONAL.tagline}
                </h2>

                <p className="text-lg text-[var(--text-muted)] max-w-lg mb-8 leading-relaxed">{PERSONAL.bio}</p>

                <div className="flex flex-wrap items-center gap-4">
                    <a
                        href="#projects"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent-cyan)] text-black rounded-full font-medium hover:opacity-90 transition-opacity"
                    >
                        View Projects
                        <ArrowRight className="w-4 h-4" />
                    </a>

                    <div className="h-8 w-px bg-[var(--border)] hidden sm:block" />

                    <div className="flex items-center gap-2">
                        <a
                            href={getContactUrl("github")}
                            target="_blank"
                            rel="noopener"
                            className="p-2.5 rounded-full border border-[var(--border)] hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)] transition-all"
                        >
                            <Github className="w-4 h-4" />
                        </a>
                        <a
                            href={getContactUrl("linkedin")}
                            target="_blank"
                            rel="noopener"
                            className="p-2.5 rounded-full border border-[var(--border)] hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)] transition-all"
                        >
                            <Linkedin className="w-4 h-4" />
                        </a>
                        <a
                            href={getContactUrl("email")}
                            className="p-2.5 rounded-full border border-[var(--border)] hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)] transition-all"
                        >
                            <Mail className="w-4 h-4" />
                        </a>
                    </div>

                    {availableForWork && (
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 text-green-400 text-sm">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                            Available
                        </span>
                    )}
                </div>
            </div>

            {/* Right - Animated Element */}
            <div className="relative order-1 lg:order-2 flex justify-center lg:justify-end">
                <AnimatedCodeBlock
                    availableForWork={availableForWork}
                    onToggle={handleToggleAvailability}
                    isAdmin={isAdmin}
                    editMode={editMode}
                />
            </div>
        </section>
    );
}
