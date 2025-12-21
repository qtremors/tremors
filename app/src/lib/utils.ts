/**
 * Utility functions for data parsing and validation
 */

/**
 * Safely parse topics JSON string with error handling
 * @param topicsJson - JSON string representing an array of topics
 * @param context - Context for debugging (unused in production)
 * @returns Parsed array of topics, or empty array on failure
 */
export function parseTopics(topicsJson: string, _context?: string): string[] {
    try {
        const parsed = JSON.parse(topicsJson);
        if (Array.isArray(parsed)) {
            return parsed;
        }
        return [];
    } catch {
        return [];
    }
}

