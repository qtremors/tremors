/**
 * Next.js Middleware
 * Provides centralized rate limiting and request validation
 */

import { NextRequest, NextResponse } from "next/server";

// In-memory rate limiting store
// Note: In production with multiple instances, use Redis or similar
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
let lastCleanup = Date.now();
const CLEANUP_INTERVAL_MS = 60_000; // Clean up expired entries every 60 seconds

// Rate limit configuration by route pattern
const RATE_LIMITS: Record<string, { requests: number; windowMs: number }> = {
    "/api/auth": { requests: 5, windowMs: 15 * 60 * 1000 }, // 5 requests per 15 min
    "/api/admin": { requests: 30, windowMs: 60 * 1000 }, // 30 requests per min
    "/api/newspaper/generate": { requests: 10, windowMs: 60 * 1000 }, // 10 per min
    "/api/stats/commits": { requests: 20, windowMs: 60 * 1000 }, // 20 per min (expensive GitHub API calls)
    "/api/newspaper/editions": { requests: 30, windowMs: 60 * 1000 }, // 30 per min (DB query)
    default: { requests: 100, windowMs: 60 * 1000 }, // 100 per min
};

async function getClientIP(request: NextRequest): Promise<string> {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
        return forwarded.split(",")[0].trim();
    }
    const ip = request.headers.get("x-real-ip");
    if (ip) return ip;
    // Fallback fingerprint: hash to prevent colliding different users on same browser while retaining anonymity
    const ua = request.headers.get("user-agent") || "";
    const lang = request.headers.get("accept-language") || "";
    
    const encoder = new TextEncoder();
    const data = encoder.encode(ua + lang + "tremors-salt");
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return `anon-${hashHex.slice(0, 16)}`;
}

function matchesRoutePrefix(pattern: string, pathname: string): boolean {
    if (pattern === "default") return true;
    return pathname === pattern || pathname.startsWith(pattern + "/");
}

function getRateLimitConfig(pathname: string): { requests: number; windowMs: number; routeKey: string } {
    for (const [pattern, config] of Object.entries(RATE_LIMITS)) {
        if (pattern !== "default" && matchesRoutePrefix(pattern, pathname)) {
            return { ...config, routeKey: pattern };
        }
    }
    return { ...RATE_LIMITS.default, routeKey: pathname };
}

function checkRateLimit(key: string, config: { requests: number; windowMs: number }): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
} {
    const now = Date.now();
    const record = rateLimitStore.get(key);

    // Deterministic cleanup of expired entries
    if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
        lastCleanup = now;
        for (const [k, v] of rateLimitStore.entries()) {
            if (now > v.resetTime) rateLimitStore.delete(k);
        }
    }

    if (!record || now > record.resetTime) {
        rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs });
        return { allowed: true, remaining: config.requests - 1, resetTime: now + config.windowMs };
    }

    if (record.count >= config.requests) {
        return { allowed: false, remaining: 0, resetTime: record.resetTime };
    }

    record.count++;
    return { allowed: true, remaining: config.requests - record.count, resetTime: record.resetTime };
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Only rate limit API routes
    if (!pathname.startsWith("/api")) {
        return NextResponse.next();
    }

    // Skip rate limiting for safe methods on non-sensitive routes
    // All routes with explicit RATE_LIMITS entries are always rate-limited
    const safeMethods = ["GET", "HEAD", "OPTIONS"];
    if (safeMethods.includes(request.method)) {
        // Check if this route has an explicit rate limit config
        const hasExplicitConfig = Object.keys(RATE_LIMITS)
            .filter(k => k !== "default")
            .some(pattern => matchesRoutePrefix(pattern, pathname));
        if (!hasExplicitConfig) {
            return NextResponse.next();
        }
    }

    const ip = await getClientIP(request);
    const { requests, windowMs, routeKey } = getRateLimitConfig(pathname);
    // Use route pattern key (not exact pathname) to group sub-routes into one bucket
    const key = `${ip}:${routeKey}`;

    const { allowed, remaining, resetTime } = checkRateLimit(key, { requests, windowMs });

    if (!allowed) {
        return NextResponse.json(
            { error: "Too many requests. Please try again later." },
            {
                status: 429,
                headers: {
                    "X-RateLimit-Limit": requests.toString(),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": Math.ceil(resetTime / 1000).toString(),
                    "Retry-After": Math.ceil((resetTime - Date.now()) / 1000).toString(),
                },
            }
        );
    }

    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Limit", requests.toString());
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    response.headers.set("X-RateLimit-Reset", Math.ceil(resetTime / 1000).toString());

    return response;
}

export const config = {
    matcher: ["/api/:path*"],
};
